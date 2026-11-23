"""The update: download the sources, read and check them, and write the data files.

The data files are replaced only when every check has passed; on any failure they stay as they
were. The steps are decision 13 of the design of the change add-vote-data.
"""

import json
import re
import shutil
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pipeline import download
from pipeline.boundaries import MapData, read_map
from pipeline.chancellery import read_chancellery
from pipeline.characteristics import (
    ELECTION_PLACE,
    NOT_A_MUNICIPALITY,
    PLACE,
    PLAIN_PLACE,
    CharacteristicsData,
    Counts,
    Cube,
    Withheld,
    check_list,
    election_years,
    group_parties,
    onto_list,
    read_areas,
    read_born_abroad,
    read_buildings,
    read_cattle,
    read_correspondences,
    read_cube,
    read_dwellings,
    read_education,
    read_elections,
    read_farms,
    read_jobs,
    read_languages,
    read_population,
    read_religions,
    required_years,
)
from pipeline.checks import (
    CantonChange,
    KnownDifference,
    check_canton_sums,
    check_entries,
    check_national_sums,
    check_official,
    counted_for,
    reference_date,
)
from pipeline.counts import SourceError, count
from pipeline.download import (
    BOUNDARIES,
    FEED,
    REGISTER,
    THEMAKART,
    THEMAKART_YEAR,
    Fetch,
    Request,
    chancellery_request,
)
from pipeline.feed import CANTONS, Day, read_day
from pipeline.register import Municipality, read_register
from pipeline.write import Data, Source, VoteData, write_data

DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")


@dataclass(frozen=True)
class Report:
    """What a run did, for the person who runs it."""

    reference_date: str
    votes: int
    validated: int
    # Each as "<id> (<date>)".
    added: list[str]
    newly_validated: list[str]
    left_out: list[str]


def _list(path: Path) -> list[dict[str, Any]]:
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise SourceError(f"{path.name}: {error}") from error
    if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
        raise SourceError(f"{path.name}: not a list of objects")
    return rows


def _text(row: dict[str, Any], key: str, where: str) -> str:
    value = row.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SourceError(f"{where}: {key!r} is {value!r}, not a text")
    return value


def read_known_differences(path: Path) -> list[KnownDifference]:
    """The differences between the entries and the official result that are written down."""
    differences = []
    for row in _list(path):
        where = f"{path.name}, vote {row.get('vote')!r}"
        if row.get("count") not in ("yes", "no"):
            raise SourceError(f"{where}: 'count' is {row.get('count')!r}, not 'yes' or 'no'")
        _text(row, "why", where)
        differences.append(
            KnownDifference(
                vote=count(row.get("vote"), "the vote", where),
                count=row["count"],
                entries=count(row.get("entries"), "the entries", where),
                official=count(row.get("official"), "the official figure", where),
            )
        )
    return differences


def read_canton_changes(path: Path) -> list[CantonChange]:
    """The municipalities that changed canton, with their earlier canton and their last day."""
    changes = []
    for row in _list(path):
        where = f"{path.name}, municipality {row.get('municipality')!r}"
        if row.get("canton") not in CANTONS:
            raise SourceError(f"{where}: 'canton' is {row.get('canton')!r}")
        until = _text(row, "until", where)
        if not DATE.fullmatch(until):
            raise SourceError(f"{where}: 'until' is {until!r}, not a date")
        _text(row, "name", where)
        _text(row, "why", where)
        changes.append(
            CantonChange(
                count(row.get("municipality"), "the municipality", where), row["canton"], until
            )
        )
    return changes


def _json(content: bytes, name: str) -> Any:
    try:
        return json.loads(content.decode("utf-8-sig"))
    except ValueError as error:
        raise SourceError(f"{name}: not JSON: {error}") from error


class _Downloads:
    """Gets each source file, keeps it in the downloads directory, and records it."""

    def __init__(self, directory: Path, fetch: Fetch, reuse: bool) -> None:
        self.directory, self.fetch, self.reuse = directory, fetch, reuse
        self.sources: list[Source] = []

    def get(self, request: Request, name: str) -> bytes | None:
        path = self.directory / name
        if self.reuse and path.exists():
            content: bytes | None = path.read_bytes()
        else:
            content = self.fetch(request)
            if content is not None:
                self.directory.mkdir(parents=True, exist_ok=True)
                part = path.with_name(name + ".part")
                part.write_bytes(content)
                part.replace(path)
        return content

    def record(
        self, address: str, content: bytes, stated: str | None, query: str | None = None
    ) -> None:
        self.sources.append(Source(address, content, stated, query))

    def answer(self, request: Request, name: str, what: str) -> bytes:
        """A source that must be there, recorded with the query it answers."""
        content = self.get(request, name)
        if content is None:
            raise SourceError(f"{request.address}: {what}")
        query = request.body.decode("utf-8") if request.body is not None else None
        self.record(request.address, content, None, query)
        return content


def _previous(data: Path) -> dict[int, tuple[str, bool]]:
    """The votes of the data files as they are: each one's date, and whether it is validated."""
    path = data / "votes.json"
    if not path.exists():
        return {}
    votes = json.loads(path.read_text(encoding="utf-8"))["votes"]
    return {vote["id"]: (vote["date"], vote["validated"]) for vote in votes}


def _put_back(data: Path) -> None:
    """A run stopped between the two moves of `_replace` left the data files in `<data>.old`."""
    old = data.with_name(data.name + ".old")
    if old.exists() and not data.exists():
        old.rename(data)


def _replace(data: Path, built: Data) -> None:
    """Write into a new directory next to `data`, then put it in the place of `data`."""
    new, old = data.with_name(data.name + ".new"), data.with_name(data.name + ".old")
    _put_back(data)
    for leftover in (new, old):
        shutil.rmtree(leftover, ignore_errors=True)
    new.mkdir(parents=True)
    try:
        write_data(new, built)
    except BaseException:
        shutil.rmtree(new, ignore_errors=True)
        raise
    if data.exists():
        data.rename(old)
    try:
        new.rename(data)
    except BaseException:
        if old.exists():
            old.rename(data)
        shutil.rmtree(new, ignore_errors=True)
        raise
    shutil.rmtree(old, ignore_errors=True)


def update(
    project: Path, data: Path, fetch: Fetch, today: str, reuse_downloads: bool = False
) -> Report:
    """Bring the data files in `data` up to date; `project` holds the lists and the downloads."""
    _put_back(data)
    known = read_known_differences(project / "known-differences.json")
    changes = read_canton_changes(project / "canton-changes.json")
    downloads = _Downloads(project / "downloads", fetch, reuse_downloads)

    request = chancellery_request()
    answer = downloads.answer(
        request, "chancellery.json", "the Federal Chancellery gives no answer"
    )
    chancellery = read_chancellery(_json(answer, "chancellery.json"), "chancellery.json")

    days: list[Day] = []
    for date in chancellery.vote_days:
        name, address = f"feed_{date.replace('-', '')}.json", FEED.format(day=date.replace("-", ""))
        content = downloads.get(Request(address), name)
        if content is None:
            if date < today:
                raise SourceError(f"{address}: the BFS has no file for the vote day {date}")
            continue
        day = read_day(_json(content, name), name)
        downloads.record(address, content, day.stated)
        days.append(day)

    reference = reference_date(days)
    year, month, day_of_month = reference.split("-")
    address = REGISTER.format(date=f"{day_of_month}-{month}-{year}")
    name = f"register_{reference}.csv"
    content = downloads.get(Request(address), name)
    if content is None:
        raise SourceError(f"{address}: the register has no list for {reference}")
    downloads.record(address, content, None)
    municipalities = read_register(content.decode("utf-8-sig"), name)
    shapes = _map(downloads, reference, [m.number for m in municipalities])

    checked = []
    swiss_abroad: dict[str, int] = {}
    for day in days:
        for vote in day.votes:
            entries = check_entries(vote, municipalities, day.source)
            counted = counted_for(vote, changes)
            check_canton_sums(vote, counted, day.source)
            check_national_sums(vote, counted, day.source)
            swiss_abroad |= entries.swiss_abroad
            checked.append((vote, counted, entries.without_result))
    # It also stops on a vote without a row of the Chancellery, so each one has one below.
    check_official([vote for vote, _, _ in checked], chancellery, known)
    votes = [
        VoteData(vote, chancellery.votes[vote.id], counted, without_result)
        for vote, counted, without_result in checked
    ]

    previous = _previous(data)
    # A vote leaves the official record only by a broken source: no update removes one.
    given = {vote.vote.id for vote in votes}
    lost = [_named(i, date) for i, (date, _) in sorted(previous.items()) if i not in given]
    if lost:
        raise SourceError(
            f"the sources no longer give these votes of the data files: {', '.join(lost)}"
        )
    first_vote_day = min(vote.vote.date for vote in votes)
    found = _characteristics(downloads, reference, municipalities, first_vote_day)
    built = Data(reference, votes, municipalities, swiss_abroad, downloads.sources, shapes, found)
    _replace(data, built)
    return Report(
        reference_date=reference,
        votes=len(votes),
        validated=sum(vote.official.validated for vote in votes),
        added=[
            _named(vote.vote.id, vote.vote.date) for vote in votes if vote.vote.id not in previous
        ],
        newly_validated=[
            _named(vote.vote.id, vote.vote.date)
            for vote in votes
            if vote.official.validated
            and vote.vote.id in previous
            and not previous[vote.vote.id][1]
        ],
        left_out=[_named(vote.id, vote.date) for day in days for vote in day.left_out],
    )


def _map(downloads: _Downloads, reference: str, listed: list[int]) -> MapData:
    """The register's boundaries of the list's reference date, and the ThemaKart set's lakes."""
    year, month, day = reference.split("-")
    files: dict[str, tuple[bytes, str]] = {}
    for division in ("Commune", "Canton", "Country"):
        address = BOUNDARIES.format(division=division, date=f"{day}-{month}-{year}")
        name = f"boundaries_{division.lower()}_{reference}.zip"
        content = downloads.get(Request(address), name)
        if content is None:
            raise SourceError(f"{address}: the register has no boundaries for {reference}")
        downloads.record(address, content, None)
        files[division] = (content, name)
    name = f"themakart_{THEMAKART_YEAR}.zip"
    content = downloads.get(Request(THEMAKART), name)
    if content is None:
        raise SourceError(f"{THEMAKART}: the BFS has no ThemaKart set {THEMAKART_YEAR}")
    downloads.record(THEMAKART, content, None)
    return read_map(
        communes=files["Commune"],
        cantons=files["Canton"],
        country=files["Country"],
        lakes=(content, name),
        listed=listed,
        lakes_set=THEMAKART_YEAR,
    )


def _register_date(date: str) -> str:
    """A date of the data (2026-01-01) as the register writes it in its addresses."""
    year, month, day = date.split("-")
    return f"{day}-{month}-{year}"


# The dimension that names the municipalities of a table, where it is not `PLACE`.
PLACES = {
    download.ELECTIONS: ELECTION_PLACE,
    download.JOBS: PLAIN_PLACE,
    download.DWELLINGS_2000: PLAIN_PLACE,
    download.BUILDINGS_2000: PLAIN_PLACE,
}


def _characteristics(
    downloads: _Downloads, reference: str, municipalities: list[Municipality], first_vote_day: str
) -> CharacteristicsData:
    """The counts of the characteristics, each source checked against the list it gives and
    brought onto the list of `reference` (design of add-characteristics, decisions 8 to 10; of
    add-more-characteristics, decisions 7 and 11)."""
    today = [m.number for m in municipalities]
    listed: dict[str, list[int]] = {}
    successors: dict[str, dict[int, set[int]]] = {}
    for date in sorted(set(download.LIST_DATES.values())):
        name = f"register_{date}.csv"
        content = downloads.answer(
            Request(REGISTER.format(date=_register_date(date))), name, f"no list for {date}"
        )
        listed[date] = [m.number for m in read_register(content.decode("utf-8-sig"), name)]
        address = download.CORRESPONDENCES.format(
            start=_register_date(date), end=_register_date(reference)
        )
        name = f"correspondences_{date}_to_{reference}.csv"
        content = downloads.answer(Request(address), name, f"no correspondences from {date}")
        successors[date] = read_correspondences(content.decode("utf-8-sig"), name)

    def cube(request: Request, name: str, table: str) -> Cube:
        found = read_cube(downloads.answer(request, name, f"STAT-TAB gives no {name}"), name)
        date = download.LIST_DATES[table]
        places = PLACES.get(table, PLACE)
        numbers = [n for n in found.municipalities(places).values() if n < NOT_A_MUNICIPALITY]
        check_list(name, date, numbers, listed[date])
        return found

    def onto(
        table: str, counts: Mapping[int, Counts], what: str, all_parts: bool = False
    ) -> dict[int, Counts]:
        date = download.LIST_DATES[table]
        return onto_list(counts, successors[date], today, what, all_parts)

    def whole(table: str, counts: Mapping[int, list[int]], what: str) -> dict[int, list[int]]:
        """Counts every municipality has, on the list."""
        return {n: _given(moved) for n, moved in onto(table, counts, what).items()}

    first_year = int(first_vote_day[:4]) - 1
    totals = cube(download.population_totals(), "population_totals.json", download.POPULATION)
    given = [int(year) for year in totals.codes_of("Jahr")]
    years = required_years(given, first_year, "population_totals.json")
    ages = [
        cube(download.population_ages(year, first, last), f"population_ages_{year}_{first}.json",
             download.POPULATION)
        for year in years
        for first, last in download.AGE_PARTS
    ]  # fmt: skip
    people = read_population(totals, ages)
    population = {
        year: whole(download.POPULATION, by_number, f"the population of {year}")
        for year, by_number in people.items()
    }

    name = "born_abroad.json"
    born = read_born_abroad(cube(download.born_abroad(), name, download.BIRTHPLACE), people)
    born_abroad: dict[int, dict[int, int]] = {}
    for year in required_years(born, first_year, name):
        one = {n: [abroad] for n, abroad in born[year].items()}
        moved = whole(download.BIRTHPLACE, one, f"those born abroad of {year}")
        born_abroad[year] = {n: counts[0] for n, counts in moved.items()}

    answers = [
        cube(download.jobs(sectors), f"jobs_{sectors[0]}.json", download.JOBS)
        for sectors in download.JOB_PARTS
    ]
    employed = read_jobs(answers)
    jobs: dict[int, dict[int, Withheld]] = {}
    for year in required_years(employed, first_year, answers[0].source):
        # Each count by itself: a part whose count is withheld leaves the sum without one.
        columns = [
            onto(
                download.JOBS,
                {n: _row(row[i]) for n, row in employed[year].items()},
                f"the jobs of {year}",
                all_parts=True,
            )
            for i in range(4)
        ]
        jobs[year] = {n: [_first(column[n]) for column in columns] for n in today}

    name = "elections_description.json"
    content = downloads.answer(download.description(download.ELECTIONS), name, "no description")
    elections: dict[int, dict[int, Counts]] = {}
    for year in election_years(_description_years(content, name), first_vote_day, name):
        found = cube(download.election(year), f"election_{year}.json", download.ELECTIONS)
        rows: dict[int, Counts] = {
            n: None if votes is None else group_parties(votes)
            for n, votes in read_elections(found)[year].items()
        }
        elections[year] = onto(download.ELECTIONS, rows, f"the election of {year}")

    head = read_cattle(cube(download.cattle(), "cattle.json", download.FARMS))
    cattle: dict[int, dict[int, int]] = {}
    for year in required_years(head, first_year, "cattle.json"):
        moved = whole(download.FARMS, {n: [count] for n, count in head[year].items()}, "cattle")
        cattle[year] = {n: counts[0] for n, counts in moved.items()}

    surveyed = read_farms(
        cube(download.farms(), "farms.json", download.FARMS),
        cube(download.farmland(), "farmland.json", download.FARMS),
        cube(download.organic_farmland(), "organic_farmland.json", download.FARMS),
    )
    farms = {
        year: whole(download.FARMS, surveyed[year], f"the farms of {year}")
        for year in required_years(surveyed, first_year, "farms.json")
    }
    if sorted(farms) != sorted(cattle):
        raise SourceError(
            f"farms.json: its years {sorted(farms)} are not those of cattle.json, {sorted(cattle)}"
        )

    census = read_languages(cube(download.census(), "census_2000.json", download.CENSUS_2000))
    languages = whole(download.CENSUS_2000, census, "the languages of 2000")
    table, name = download.RELIGION_2000, "religion_2000.json"
    religion = whole(table, read_religions(cube(download.religion(), name, table)), "religion")
    table, name = download.EDUCATION_2000, "education_2000.json"
    education = whole(table, read_education(cube(download.education(), name, table)), "education")
    table = download.DWELLINGS_2000
    answers = [
        cube(download.dwellings(rooms), f"dwellings_2000_{rooms[0]}.json", table)
        for rooms in download.ROOM_PARTS
    ]
    dwellings = whole(table, read_dwellings(answers), "the dwellings of 2000")
    table, name = download.BUILDINGS_2000, "buildings_2000.json"
    buildings = whole(table, read_buildings(cube(download.buildings(), name, table)), "buildings")

    name = "swissboundaries3d_2026-01.zip"
    content = downloads.answer(Request(download.SWISSBOUNDARIES), name, "swisstopo gives no areas")
    areas = read_areas(content, name)
    check_list(name, reference, areas, today)
    return CharacteristicsData(
        municipalities=today,
        population=population,
        elections=elections,
        cattle=cattle,
        languages=languages,
        areas=areas,
        born_abroad=born_abroad,
        jobs=jobs,
        farms=farms,
        religion=religion,
        education=education,
        dwellings=dwellings,
        buildings=buildings,
    )


def _given(counts: Counts) -> list[int]:
    """Counts every municipality has: only an election can be without them."""
    if counts is None:
        raise SourceError("a municipality has no counts where every one must have them")
    return counts


def _row(held: int | None) -> Counts:
    """One count as a row, none for a count the source withholds."""
    return None if held is None else [held]


def _first(counts: Counts) -> int | None:
    """The one count of a row, or none."""
    return None if counts is None else counts[0]


def _description_years(content: bytes, name: str) -> list[int]:
    """The years a STAT-TAB table's description gives."""
    variables = _json(content, name).get("variables", [])
    years = [v["values"] for v in variables if v.get("code") == "Jahr"]
    if len(years) != 1 or not all(re.fullmatch(r"[0-9]{4}", y) for y in years[0]):
        raise SourceError(f"{name}: no years of the elections")
    return [int(year) for year in years[0]]


def _named(vote_id: int, date: str) -> str:
    return f"{vote_id} ({date})"
