"""Reader of the characteristics' sources (investigations/characteristics.md).

The BFS statistics API (STAT-TAB) answers a query of a table in json-stat2: the codes and labels
of each dimension, and one value per combination of codes, `null` where the table writes a sign
such as "...". A municipality's label starts with six dots; some tables put its number in the
label (`......0261 Zürich`), the others use it as the code. Three tables list municipalities
only, beside Switzerland, in a dimension "Gemeinde" whose labels start with the number, without
dots (`0261 Zürich`). Every count passes `counts.count`.
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
# The dimension of the tables that list municipalities only, beside Switzerland.
PLAIN_PLACE = "Gemeinde"
PLAIN = re.compile(r"([0-9]+) ")
SWITZERLAND = "Schweiz"


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
            if dimension == PLAIN_PLACE:
                if label != SWITZERLAND:
                    plain = PLAIN.match(label)
                    if not plain:
                        raise SourceError(f"{self.source}: {label!r} has no number")
                    found[code] = int(plain.group(1))
            elif label.startswith("......"):
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


def _farm_counts(cube: Cube, figure: str, adds_up: bool = True) -> dict[int, dict[int, int]]:
    """Per year, per municipality: the one count of an answer of the farm structure survey. The
    municipalities add up to Switzerland, unless `adds_up` says that they do not."""
    municipalities = cube.municipalities()
    counts: dict[int, dict[int, int]] = {}
    for code, year in _years(cube).items():
        counts[year] = {
            number: cube.get(
                _cell(cube, YEAR, code, PLACE, place), figure, f"municipality {number}, {year}"
            )
            for place, number in municipalities.items()
        }
        if adds_up:
            total = sum(counts[year].values())
            _check_switzerland(cube, _cell(cube, YEAR, code), total, figure, str(year))
    return counts


def read_cattle(cube: Cube) -> dict[int, dict[int, int]]:
    """Per year, per municipality: its cattle (the farm structure survey's "Tiere - Rinder")."""
    return _farm_counts(cube, "cattle")


def read_farms(farms: Cube, farmland: Cube, organic: Cube) -> dict[int, dict[int, list[int]]]:
    """Per year, per municipality: its farms, their farmland, and the farmland of the organic
    ones, in whole hectares as the table gives them. The farmland is not added up over
    Switzerland: each municipality's is a whole number of hectares, and the sums differ
    (investigations/more-characteristics.md, 7). A municipality's organic farmland is at most
    its farmland."""
    land = _farm_counts(farmland, "farmland", adds_up=False)
    organic_land = _farm_counts(organic, "organic farmland", adds_up=False)
    found: dict[int, dict[int, list[int]]] = {}
    for year, by_number in _farm_counts(farms, "farms").items():
        found[year] = {}
        for number, held in by_number.items():
            row = [held, land[year][number], organic_land[year][number]]
            if row[2] > row[1]:
                raise SourceError(
                    f"{organic.source}, municipality {number}, {year}: its {row[2]} hectares of "
                    f"organic farmland are more than its {row[1]} hectares of farmland"
                )
            found[year][number] = row
    return found


BIRTHPLACE = "Geburtsort"


def read_born_abroad(
    cube: Cube, population: Mapping[int, Mapping[int, Sequence[int]]]
) -> dict[int, dict[int, int]]:
    """Per year, per municipality: its permanent residents born abroad, at the end of the year.
    `population` is the population table's, as `read_population` gives it: in a year both tables
    give, a municipality has the same inhabitants in both."""
    municipalities = cube.municipalities()
    born: dict[int, dict[int, int]] = {}
    for code, year in _years(cube).items():
        for place, number in municipalities.items() if year in population else ():
            where = f"municipality {number}, {year}"
            cell = _cell(cube, YEAR, code, PLACE, place, BIRTHPLACE, "-99999")
            inhabitants, given = cube.get(cell, "inhabitants", where), population[year][number][0]
            if inhabitants != given:
                raise SourceError(
                    f"{cube.source}, {where}: its {inhabitants} inhabitants are not the {given} "
                    "of the population table"
                )
        born[year] = {
            number: cube.get(
                _cell(cube, YEAR, code, PLACE, place, BIRTHPLACE, "2"),
                "born abroad",
                f"municipality {number}, {year}",
            )
            for place, number in municipalities.items()
        }
        cell = _cell(cube, YEAR, code, BIRTHPLACE, "2")
        _check_switzerland(cube, cell, sum(born[year].values()), "born abroad", str(year))
    return born


SECTOR = "Wirtschaftssektor"
# The codes of all jobs and of those of the primary, the secondary and the tertiary sector.
SECTORS = {
    "999": "jobs",
    "1": "jobs of the primary sector",
    "2": "jobs of the secondary sector",
    "3": "jobs of the tertiary sector",
}
# The sign the jobs table writes in place of a count it withholds.
WITHHELD = "X"

Withheld = list[int | None]


def read_jobs(cubes: Sequence[Cube]) -> dict[int, dict[int, Withheld]]:
    """Per year, per municipality: the employed persons at its workplaces at the end of the year
    (STATENT), all and of each sector, from the answers by sectors. None for a count the table
    withholds; any other sign stops the run, as a missing count does. The sectors add up to all
    jobs where none of the four counts is withheld. The municipalities are not added up over
    Switzerland: with counts withheld they do not reach its figures."""
    of_sector = {sector: cube for cube in cubes for sector in cube.codes_of(SECTOR)}
    first = cubes[0]
    jobs: dict[int, dict[int, Withheld]] = {}
    for code, year in _years(first).items():
        jobs[year] = {}
        for place, number in first.municipalities(PLAIN_PLACE).items():
            where = f"municipality {number}, {year}"
            row: Withheld = []
            for sector, name in SECTORS.items():
                cube = of_sector[sector]
                cell = _cell(cube, YEAR, code, PLAIN_PLACE, place, SECTOR, sector)
                row.append(None if cube.sign(cell) == WITHHELD else cube.get(cell, name, where))
            given = [held for held in row if held is not None]
            if len(given) == len(row) and sum(given[1:]) != given[0]:
                raise SourceError(
                    f"{first.source}, {where}: its sectors add up to {sum(given[1:])}, not to "
                    f"its {given[0]} jobs"
                )
            jobs[year][number] = row
    return jobs


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


def _parts_of_2000(
    cube: Cube, dimension: str, names: Mapping[str, str], parts: str
) -> dict[int, dict[str, int]]:
    """Per municipality, the inhabitants of 2000 by every code of `dimension`, "0" being all of
    them. In a municipality the other codes add up to all its inhabitants, and for every code
    the municipalities add up to Switzerland. `names` names a code in a message, the table's
    label the others; `parts` names what adds up ("religions")."""
    named = {
        code: names.get(code, cube.label(dimension, code)) for code in cube.codes_of(dimension)
    }
    found: dict[int, dict[str, int]] = {}
    totals = dict.fromkeys(named, 0)
    for place, number in cube.municipalities().items():
        where = f"municipality {number}, 2000"
        counts = {
            code: cube.get(_cell(cube, PLACE, place, dimension, code), name, where)
            for code, name in named.items()
        }
        added = sum(counts.values()) - counts["0"]
        if added != counts["0"]:
            raise SourceError(
                f"{cube.source}, {where}: its {parts} add up to {added}, not to its "
                f"{counts['0']} inhabitants"
            )
        found[number] = counts
        for code, given in counts.items():
            totals[code] += given
    for code, name in named.items():
        _check_switzerland(cube, _cell(cube, dimension, code), totals[code], name, "2000")
    return found


RELIGION = "Religion"
# The census of 2000: the codes of all religions and of the three the characteristics name.
RELIGIONS = {
    "0": "all religions",
    "1": "Evangelical Reformed",
    "8": "Roman Catholic",
    "17": "no religious affiliation",
}


def read_religions(cube: Cube) -> dict[int, list[int]]:
    """Per municipality, the inhabitants of 2000 (economic residence): all of them, the
    Evangelical Reformed, the Roman Catholic and those without a religious affiliation."""
    return {
        number: [counts[code] for code in RELIGIONS]
        for number, counts in _parts_of_2000(cube, RELIGION, RELIGIONS, "religions").items()
    }


EDUCATION = "Höchste abgeschlossene Ausbildung"
# The census of 2000: the codes of the levels of none or compulsory school, of upper secondary
# and of tertiary education. Those without an answer ("11"), of school age ("12") and below it
# ("13") are in none (design of add-more-characteristics, decision 5).
LEVELS = (("1", "2"), ("3", "4", "5", "6"), ("7", "8", "9", "10"))


def read_education(cube: Cube) -> dict[int, list[int]]:
    """Per municipality, the inhabitants of 2000 (economic residence) by their highest completed
    education: none or compulsory school, upper secondary, tertiary."""
    return {
        number: [sum(counts[code] for code in level) for level in LEVELS]
        for number, counts in _parts_of_2000(cube, EDUCATION, {}, "levels of education").items()
    }


def _survey_of_2000(
    cubes: Sequence[Cube], kinds: str, chosen: Sequence[str], what: str
) -> dict[int, list[int]]:
    """Per municipality, from answers of the buildings and dwellings survey of 2000: all that
    the answers count, and those of them whose code of the dimension `kinds` is among `chosen`.
    Every cell of an answer is added; `what` names what is counted."""
    found: dict[int, list[int]] = {}
    for cube in cubes:
        if cube.codes_of(YEAR) != ("2000",):
            raise SourceError(
                f"{cube.source}: its figures are of the years {list(cube.codes_of(YEAR))}, not "
                "of 2000 alone"
            )
        others = [d for d in cube.dimensions if d not in (PLAIN_PLACE, YEAR)]
        municipalities = cube.municipalities(PLAIN_PLACE)
        for codes in itertools.product(*(cube.codes_of(d) for d in others)):
            cell = dict(zip(others, codes, strict=True)) | {YEAR: "2000"}
            figure = f"{what} ({', '.join(cube.label(d, cell[d]) for d in others)})"
            total = 0
            for place, number in municipalities.items():
                given = cube.get(
                    cell | {PLAIN_PLACE: place}, figure, f"municipality {number}, 2000"
                )
                row = found.setdefault(number, [0, 0])
                row[0] += given
                row[1] += given if cell[kinds] in chosen else 0
                total += given
            _check_switzerland(cube, cell, total, figure, "2000", PLAIN_PLACE)
    return found


# The occupants who own their dwelling: the flat, the house alone, the house with others.
OWNERS = ("3", "4", "5")


def read_dwellings(cubes: Sequence[Cube]) -> dict[int, list[int]]:
    """Per municipality, the occupied dwellings of 2000 and those lived in by their owner, added
    up over the answers by number of rooms."""
    return _survey_of_2000(cubes, "Bewohnertyp", OWNERS, "occupied dwellings")


def read_buildings(cube: Cube) -> dict[int, list[int]]:
    """Per municipality, the buildings with dwellings of 2000 and the single-family houses among
    them, added up over the periods of construction."""
    return _survey_of_2000([cube], "Gebäudekategorie", ("EFH",), "buildings with dwellings")


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
    cube: Cube, cell: dict[str, str], total: int, figure: str, where: str, place: str = PLACE
) -> None:
    """Stop unless the municipalities add up to the table's figure for Switzerland."""
    swiss = [code for code in cube.codes_of(place) if cube.label(place, code) == SWITZERLAND]
    if len(swiss) != 1:
        raise SourceError(f"{cube.source}: no single figure for Switzerland")
    given = cube.get(cell | {place: swiss[0]}, f"{figure} of Switzerland", where)
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
    reader = csv.DictReader(io.StringIO(text))
    columns = reader.fieldnames or []
    if "InitialCode" not in columns or "TerminalCode" not in columns:
        raise SourceError(f"{source}: the columns InitialCode and TerminalCode are not there")
    successors: dict[int, set[int]] = {}
    # No row when no municipality changed: the table already gives the list of the end date.
    for row in reader:
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
    all_parts: bool = False,
) -> dict[int, Counts]:
    """Counts given per municipality of an earlier list, added up per municipality of the list
    `listed`: each earlier municipality is part of the municipalities `successors` names, or of
    itself when it did not change. An earlier municipality that is part of several of today's
    makes them one group, and each member gets the group's counts. A municipality without a
    figure (None) adds nothing, as one that counts its votes with another; with `all_parts` it
    leaves its group without a figure, as a count the source withholds."""
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
    without: set[frozenset[int]] = set()
    for number, value in counts.items():
        group = group_of[min(leads[number])]
        if value is None:
            without.add(group)
        else:
            added = sums.get(group)
            sums[group] = (
                value if added is None else [a + b for a, b in zip(added, value, strict=True)]
            )
    if all_parts:
        sums = {group: added for group, added in sums.items() if group not in without}
    return {member: sums.get(group_of[member]) for member in sorted(today)}


def required_years(table: Iterable[int], first: int, source: str) -> list[int]:
    """The years the data needs: every year from `first` to the newest the table gives, each of
    them there."""
    years = set(table)
    missing = [year for year in range(first, max(years | {first}) + 1) if year not in years]
    if missing:
        raise SourceError(f"{source}: no figures of the years {missing}")
    return sorted(year for year in years if year >= first)


def election_years(table: Iterable[int], first_vote_day: str, source: str) -> list[int]:
    """The elections the data needs: from the last before the first vote day to the newest the
    table gives, each of them there. Every election of the table from the first of
    `ELECTION_DAYS` on must have its day there."""
    years = sorted(set(table))
    unknown = [year for year in years if year >= min(ELECTION_DAYS) and year not in ELECTION_DAYS]
    if unknown:
        raise SourceError(
            f"{source}: the elections of {unknown} have no day in the pipeline's ELECTION_DAYS "
            "(pipeline/src/pipeline/download.py)"
        )
    last_before = max(year for year, day in ELECTION_DAYS.items() if day < first_vote_day)
    newest = max([*years, last_before])
    missing = [y for y in sorted(ELECTION_DAYS) if last_before <= y <= newest and y not in years]
    if missing:
        raise SourceError(f"{source}: no figures of the elections {missing}")
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
    # Per year: those born abroad.
    born_abroad: dict[int, dict[int, int]]
    # Per year: all jobs and those of the primary, the secondary and the tertiary sector, each
    # None where the source withholds it (design of add-more-characteristics, decisions 7, 10).
    jobs: dict[int, dict[int, Withheld]]
    # Per year: the farms, their farmland and the farmland of the organic ones, in ha.
    farms: dict[int, dict[int, list[int]]]
    # The census of 2000: all inhabitants, the Evangelical Reformed, the Roman Catholic and those
    # without a religious affiliation.
    religion: dict[int, list[int]]
    # The inhabitants with none or compulsory school, upper secondary and tertiary education.
    education: dict[int, list[int]]
    # The occupied dwellings and those lived in by their owner.
    dwellings: dict[int, list[int]]
    # The buildings with dwellings and the single-family houses among them.
    buildings: dict[int, list[int]]
