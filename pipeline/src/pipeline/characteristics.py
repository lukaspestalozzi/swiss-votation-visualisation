"""Reader of the characteristics' sources (investigations/characteristics.md).

The BFS statistics API (STAT-TAB) answers a query of a table in json-stat2: the codes and labels
of each dimension, and one value per combination of codes, `null` where the table writes a sign
such as "...". A municipality's label starts with six dots; some tables put its number in the
label (`......0261 Zürich`), the others use it as the code. Every count passes `counts.count`.
"""

import csv
import io
import itertools
import json
import re
import zipfile
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass

import shapefile

from pipeline.counts import SourceError, count
from pipeline.download import ELECTION_DAYS

# The five age groups, by their first and last single year; 100 stands for "100 and over".
AGE_GROUPS = ((0, 17), (18, 34), (35, 49), (50, 64), (65, 100))
YEAR = "Jahr"
PLACE = "Kanton (-) / Bezirk (>>) / Gemeinde (......)"
NUMBERED = re.compile(r"\.{6}([0-9]{4}) ")


@dataclass(frozen=True)
class Cube:
    """A json-stat2 answer: per dimension its codes in order and their labels, and the values."""

    source: str
    dimensions: tuple[str, ...]
    codes: tuple[tuple[str, ...], ...]
    labels: tuple[dict[str, str], ...]
    values: dict[tuple[str, ...], object]
    # The sign the table writes in place of a missing value, such as "...".
    signs: dict[tuple[str, ...], str]

    def codes_of(self, dimension: str) -> tuple[str, ...]:
        return self.codes[self._index(dimension)]

    def label(self, dimension: str, code: str) -> str:
        return self.labels[self._index(dimension)][code]

    def _index(self, dimension: str) -> int:
        if dimension not in self.dimensions:
            raise SourceError(f"{self.source}: no dimension {dimension!r} in {self.dimensions}")
        return self.dimensions.index(dimension)

    def municipalities(self, dimension: str = PLACE) -> dict[str, int]:
        """The codes of the municipalities of a geographic dimension, with their numbers."""
        found = {}
        for code in self.codes_of(dimension):
            label = self.label(dimension, code)
            if label.startswith("......"):
                numbered = NUMBERED.match(label)
                number = numbered.group(1) if numbered else code
                if not re.fullmatch(r"[0-9]+", number):
                    raise SourceError(f"{self.source}: {label!r} has no number")
                found[code] = int(number)
        return found

    def get(self, cell: dict[str, str], figure: str, where: str) -> int:
        """The count of one cell, named by a code of each dimension."""
        return count(self.values.get(self._key(cell)), figure, f"{self.source}, {where}")

    def sign(self, cell: dict[str, str]) -> str | None:
        """The sign of a cell without a value, or None."""
        key = self._key(cell)
        return self.signs.get(key) if self.values.get(key) is None else None

    def _key(self, cell: dict[str, str]) -> tuple[str, ...]:
        return tuple(cell[dimension] for dimension in self.dimensions)


def read_cube(content: bytes, source: str) -> Cube:
    """A STAT-TAB answer in json-stat2; `source` names it in messages."""
    try:
        answer = json.loads(content.decode("utf-8-sig"))
        dimensions = tuple(str(d) for d in answer["id"])
        codes, labels = [], []
        for dimension in dimensions:
            category = answer["dimension"][dimension]["category"]
            ordered = sorted(category["index"].items(), key=lambda item: item[1])
            codes.append(tuple(str(code) for code, _ in ordered))
            labels.append({str(code): str(category["label"][code]) for code, _ in ordered})
        values: list[object] = answer["value"]
        status: dict[str, str] = answer.get("status") or {}
        keys = list(itertools.product(*codes))
        signs = {keys[int(index)]: str(sign) for index, sign in status.items()}
    except (ValueError, KeyError, TypeError, IndexError, AttributeError) as error:
        raise SourceError(f"{source}: not a json-stat2 answer ({error!r})") from error
    if len(keys) != len(values):
        raise SourceError(f"{source}: {len(values)} values for {len(keys)} cells")
    return Cube(source, dimensions, tuple(codes), tuple(labels), dict(zip(keys, values)), signs)


def _group(age: str, source: str) -> int:
    if not re.fullmatch(r"[0-9]+", age):
        raise SourceError(f"{source}: the age {age!r} is not a number")
    return next(i for i, (first, last) in enumerate(AGE_GROUPS) if first <= int(age) <= last)


def read_population(totals: Cube, ages: Sequence[Cube]) -> dict[int, dict[int, list[int]]]:
    """Per year of the answers by age, per municipality: its inhabitants, its foreigners and its
    five age groups, at the end of the year."""
    municipalities = totals.municipalities()
    population: dict[int, dict[int, list[int]]] = {}
    for part in ages:
        for code_of_year in part.codes_of(YEAR):
            rows = population.setdefault(int(code_of_year), {})
            for code, number in municipalities.items():
                where = f"municipality {number}, {code_of_year}"
                row = rows.setdefault(number, [0] * 7)
                for age in part.codes_of("Alter"):
                    cell = _cell(part, YEAR, code_of_year, PLACE, code, "Alter", age)
                    row[2 + _group(age, part.source)] += part.get(cell, f"aged {age}", where)
    for year, rows in population.items():
        for code, number in municipalities.items():
            where = f"municipality {number}, {year}"
            cell = _cell(totals, YEAR, str(year), PLACE, code)
            rows[number][0] = totals.get(cell | _nationality("-99999"), "inhabitants", where)
            rows[number][1] = totals.get(cell | _nationality("2"), "foreigners", where)
            inhabitants, foreigners, *groups = rows[number]
            if foreigners > inhabitants:
                raise SourceError(
                    f"{totals.source}, {where}: its {foreigners} foreigners are more than its "
                    f"{inhabitants} inhabitants"
                )
            if sum(groups) != inhabitants:
                raise SourceError(
                    f"{totals.source}, {where}: its single years of age add up to {sum(groups)}, "
                    f"not to its {inhabitants} inhabitants"
                )
        for i, figure, nationality in ((0, "inhabitants", "-99999"), (1, "foreigners", "2")):
            cell = _cell(totals, YEAR, str(year)) | _nationality(nationality)
            total = sum(row[i] for row in rows.values())
            _check_switzerland(totals, cell, total, figure, str(year))
    return population


def _nationality(code: str) -> dict[str, str]:
    return {"Staatsangehörigkeit (Kategorie)": code}


def _cell(cube: Cube, *named: str) -> dict[str, str]:
    """A cell: the codes given as dimension and code, and the only code of every other one."""
    given = dict(zip(named[::2], named[1::2], strict=True))
    cell = {}
    for dimension, codes in zip(cube.dimensions, cube.codes, strict=True):
        if dimension in given:
            cell[dimension] = given[dimension]
        elif len(codes) == 1:
            cell[dimension] = codes[0]
    return cell


def _years(cube: Cube) -> dict[str, int]:
    """The year of each code of the dimension "Jahr": some tables code the years by a running
    number and give the year as the label."""
    years = {}
    for code in cube.codes_of(YEAR):
        label = cube.label(YEAR, code)
        if not re.fullmatch(r"[0-9]{4}", label):
            raise SourceError(f"{cube.source}: the year {label!r} is not a year")
        years[code] = int(label)
    return years


def read_cattle(cube: Cube) -> dict[int, dict[int, int]]:
    """Per year, per municipality: its cattle (the farm structure survey's "Tiere - Rinder")."""
    municipalities = cube.municipalities()
    cattle: dict[int, dict[int, int]] = {}
    for code, year in _years(cube).items():
        cattle[year] = {
            number: cube.get(
                _cell(cube, YEAR, code, PLACE, place), "cattle", f"municipality {number}, {year}"
            )
            for place, number in municipalities.items()
        }
        total = sum(cattle[year].values())
        _check_switzerland(cube, _cell(cube, YEAR, code), total, "cattle", str(year))
    return cattle


# The census of 2000: the codes of all main languages and of the four national languages.
LANGUAGES = {
    "0": "all main languages",
    "1": "German",
    "2": "French",
    "3": "Italian",
    "4": "Romansh",
}


def read_languages(cube: Cube) -> dict[int, list[int]]:
    """Per municipality, the inhabitants of 2000 (economic residence) with any main language and
    with each national language as main language."""
    languages = {
        number: [
            cube.get(
                _cell(cube, PLACE, place, "Hauptsprache", code),
                name,
                f"municipality {number}, 2000",
            )
            for code, name in LANGUAGES.items()
        ]
        for place, number in cube.municipalities().items()
    }
    for i, (code, name) in enumerate(LANGUAGES.items()):
        total = sum(row[i] for row in languages.values())
        _check_switzerland(cube, _cell(cube, "Hauptsprache", code), total, name, "2000")
    return languages


def check_list(source: str, date: str, given: Iterable[int], listed: Iterable[int]) -> None:
    """Stop unless a source's municipalities are exactly the register's list of `date`."""
    given, listed = set(given), set(listed)
    extra, missing = sorted(given - listed), sorted(listed - given)
    if extra or missing:
        raise SourceError(
            f"{source}: its municipalities are not the register's list of {date}: "
            f"not on the list {extra}, missing {missing}"
        )


# swisstopo's layer of the areas of the municipalities in swissBOUNDARIES3D.
AREA_LAYER = "swissBOUNDARIES3D_1_5_TLM_HOHEITSGEBIET.dbf"


def read_areas(content: bytes, source: str) -> dict[int, int]:
    """swisstopo's area of each Swiss municipality, its part in a lake included, in ha. The
    layer also has the lakes that belong to a canton and the municipalities beyond the border;
    they are left out."""
    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
        names = [name for name in archive.namelist() if name.endswith(AREA_LAYER)]
        if len(names) != 1:
            raise SourceError(f"{source}: no single {AREA_LAYER} in the ZIP")
        layer = shapefile.Reader(dbf=io.BytesIO(archive.read(names[0])), encoding="utf-8")
        # records() leaves out deleted records (None only with deleted_as_None); this narrows
        # pyshp's type.
        records = [record for record in layer.records() if record is not None]
    except zipfile.BadZipFile as error:
        raise SourceError(f"{source}: not a ZIP ({error})") from error
    areas: dict[int, int] = {}
    for record in records:
        if record["OBJEKTART"] != "Gemeindegebiet" or record["ICC"] != "CH":
            continue
        number = count(record["BFS_NUMMER"], "the number", source)
        if number in areas:
            raise SourceError(f"{source}: the municipality {number} has two areas")
        where = f"{source}, municipality {number}"
        areas[number] = count(record["GEM_FLAECH"], "the area", where)
        if areas[number] == 0:
            raise SourceError(f"{where}: the area is 0, not above zero")
    return areas


def _check_switzerland(
    cube: Cube, cell: dict[str, str], total: int, figure: str, where: str
) -> None:
    """Stop unless the municipalities add up to the table's figure for Switzerland."""
    swiss = [code for code in cube.codes_of(PLACE) if cube.label(PLACE, code) == "Schweiz"]
    if len(swiss) != 1:
        raise SourceError(f"{cube.source}: no single figure for Switzerland")
    given = cube.get(cell | {PLACE: swiss[0]}, f"{figure} of Switzerland", where)
    if total != given:
        raise SourceError(
            f"{cube.source}, {where}: the municipalities add up to {total} {figure}, not {given}"
        )


ELECTION_PLACE = "Bezirk (>>) / Gemeinde (......)"
PARTY = "Partei"
# Entries from 9000 on are the Swiss abroad and other votes of no municipality.
NOT_A_MUNICIPALITY = 9000
NO_LIST = "..."

Votes = dict[str, int]


def read_elections(cube: Cube) -> dict[int, dict[int, Votes | None]]:
    """Per election year, per municipality: the votes of each party by its code, or None for a
    municipality without an election result of its own. The table writes "..." for a party
    without a list in the canton, which gets no votes, and for every party of a municipality
    without a result. Each district's municipalities add up to the district."""
    elections: dict[int, dict[int, Votes | None]] = {}
    parties = cube.codes_of(PARTY)
    municipalities = cube.municipalities(ELECTION_PLACE)
    for year in cube.codes_of(YEAR):
        rows: dict[str, Votes] = {}
        for place in cube.codes_of(ELECTION_PLACE):
            name = cube.label(ELECTION_PLACE, place)
            where = f"municipality {municipalities[place]}" if place in municipalities else name
            where += f", {year}"
            rows[place] = {}
            for party in parties:
                cell = _cell(cube, ELECTION_PLACE, place, YEAR, year, PARTY, party)
                if cube.sign(cell) != NO_LIST:
                    figure = f"votes for {cube.label(PARTY, party)}"
                    rows[place][party] = cube.get(cell, figure, where)
        _check_districts(cube, year, rows)
        elections[int(year)] = {
            number: rows[place] or None
            for place, number in municipalities.items()
            if number < NOT_A_MUNICIPALITY
        }
    return elections


def _check_districts(cube: Cube, year: str, rows: dict[str, Votes]) -> None:
    """Each district comes before its municipalities and adds them up, party by party."""
    district: str | None = None
    sums: dict[str, dict[str, int]] = {}
    for place, votes in rows.items():
        label = cube.label(ELECTION_PLACE, place)
        if label.startswith(">>"):
            district = place
            sums[district] = {}
        elif district is None or not label.startswith("......"):
            raise SourceError(f"{cube.source}, {year}: {label!r} belongs to no district")
        else:
            for party, given in votes.items():
                sums[district][party] = sums[district].get(party, 0) + given
    for place, total in sums.items():
        for party in cube.codes_of(PARTY):
            added, given = total.get(party, 0), rows[place].get(party, 0)
            if added != given:
                raise SourceError(
                    f"{cube.source}, {year}: the municipalities of "
                    f"{cube.label(ELECTION_PLACE, place)!r} add up to {added} votes for "
                    f"{cube.label(PARTY, party)}, not {given}"
                )


# The named parties of the characteristics, by the table's codes; Die Mitte counts CVP and BDP
# before their merger on 2021-01-01. Every other party is among the others.
PARTY_GROUPS = {
    "FDP": ("1",),
    "Die Mitte": ("34", "2", "32"),
    "SP": ("3",),
    "SVP": ("4",),
    "GLP": ("31",),
    "Grüne": ("13",),
}


def group_parties(votes: Votes) -> list[int]:
    """A municipality's votes as those of the six named parties and, last, of the others."""
    named = [sum(votes.get(code, 0) for code in codes) for codes in PARTY_GROUPS.values()]
    return [*named, sum(votes.values()) - sum(named)]


def read_correspondences(text: str, source: str) -> dict[int, set[int]]:
    """The register's correspondences: each municipality of the start date that changed, with
    the municipalities of the end date it is part of."""
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or "InitialCode" not in rows[0] or "TerminalCode" not in rows[0]:
        raise SourceError(f"{source}: the columns InitialCode and TerminalCode are not there")
    successors: dict[int, set[int]] = {}
    for row in rows:
        codes = row["InitialCode"], row["TerminalCode"]
        if not all(re.fullmatch(r"[0-9]+", code) for code in codes):
            raise SourceError(f"{source}: the row {codes} does not hold two numbers")
        successors.setdefault(int(codes[0]), set()).add(int(codes[1]))
    return successors


Counts = list[int] | None


def onto_list(
    counts: Mapping[int, Counts],
    successors: Mapping[int, set[int]],
    listed: Iterable[int],
    source: str,
) -> dict[int, Counts]:
    """Counts given per municipality of an earlier list, added up per municipality of the list
    `listed`: each earlier municipality is part of the municipalities `successors` names, or of
    itself when it did not change. An earlier municipality that is part of several of today's
    makes them one group, and each member gets the group's counts. A municipality without a
    figure (None) adds nothing."""
    today = set(listed)
    leads = {number: successors.get(number, {number}) for number in counts}
    group_of: dict[int, frozenset[int]] = {}
    for number, terminals in leads.items():
        if not terminals or not terminals <= today:
            raise SourceError(
                f"{source}: the municipality {number} leads to {sorted(terminals)}, which are not "
                "all on the list"
            )
        group = frozenset(terminals).union(*(group_of[t] for t in terminals if t in group_of))
        for member in group:
            group_of[member] = group
    missing = sorted(today - set(group_of))
    if missing:
        raise SourceError(f"{source}: no figures for the municipalities {missing}")
    sums: dict[frozenset[int], Counts] = {}
    for number, value in counts.items():
        group = group_of[min(leads[number])]
        if value is not None:
            added = sums.get(group)
            sums[group] = (
                value if added is None else [a + b for a, b in zip(added, value, strict=True)]
            )
    return {member: sums.get(group_of[member]) for member in sorted(today)}


def election_years(table: Iterable[int], first_vote_day: str, source: str) -> list[int]:
    """The elections the data needs: from the last before the first vote day to the newest the
    table gives. Every election of the table from the first of `ELECTION_DAYS` on must have its
    day there."""
    years = sorted(set(table))
    unknown = [year for year in years if year >= min(ELECTION_DAYS) and year not in ELECTION_DAYS]
    if unknown:
        raise SourceError(
            f"{source}: the elections of {unknown} have no day in the pipeline's ELECTION_DAYS "
            "(pipeline/src/pipeline/download.py)"
        )
    last_before = max(year for year, day in ELECTION_DAYS.items() if day < first_vote_day)
    return [year for year in years if year >= last_before]


@dataclass(frozen=True)
class CharacteristicsData:
    """Everything `characteristics.json` holds but its reference date: per municipality of the
    list, the counts of each year and election, None for a municipality without an election
    result of its own (design of add-characteristics, decisions 11 and 12)."""

    municipalities: list[int]
    # Per year: inhabitants, foreigners, and the five age groups.
    population: dict[int, dict[int, list[int]]]
    # Per election year: the votes of the six named parties and of the others, or None.
    elections: dict[int, dict[int, Counts]]
    # Per year: the cattle.
    cattle: dict[int, dict[int, int]]
    # The census of 2000: all main languages, German, French, Italian, Romansh.
    languages: dict[int, list[int]]
    # The area in ha.
    areas: dict[int, int]
