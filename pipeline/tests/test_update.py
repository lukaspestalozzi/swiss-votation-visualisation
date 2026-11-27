import hashlib
import json
from pathlib import Path
from typing import Any

import made_up
import pytest

from pipeline import download
from pipeline.__main__ import main
from pipeline.counts import SourceError
from pipeline.download import BOUNDARIES, FEED, REGISTER, SPARQL, THEMAKART, Request
from pipeline.update import update

TODAY = "2026-11-14"
DAYS = ("2016-02-28", "2026-03-08", "2026-11-29")
MOUTIER = {
    "municipality": 6831,
    "name": "Moutier",
    "canton": "BE",
    "until": "2025-12-31",
    "why": "The made-up files count it for BE until 2025, as the real ones do.",
}


class Sources:
    """A fake of the three servers: the made-up documents, by address."""

    def __init__(self, chancellery: dict[str, Any] | None = None) -> None:
        self.files: dict[str, bytes] = {
            SPARQL: json.dumps(chancellery or made_up.chancellery()).encode(),
            REGISTER.format(date="01-01-2026"): made_up.register().encode(),
            THEMAKART: made_up.themakart(),
        }
        for division in ("Commune", "Canton", "Country"):
            address = BOUNDARIES.format(division=division, date="01-01-2026")
            self.files[address] = made_up.boundaries(division)
        for day in DAYS:
            feed = made_up.feed_day(day)
            self.files[FEED.format(day=day.replace("-", ""))] = json.dumps(feed).encode()
        # The answers to a query, by address and body.
        self.queries: dict[tuple[str, bytes], bytes] = {}
        self.characteristics("01-01-2026")
        self.requested: list[str] = []

    def characteristics(self, reference: str) -> None:
        """The characteristics' sources for the list of `reference` (dd-mm-yyyy)."""
        for date in set(made_up.LIST_DATES.values()):
            start = "-".join(reversed(date.split("-")))
            self.files[REGISTER.format(date=start)] = made_up.register_of(date).encode()
            address = download.CORRESPONDENCES.format(start=start, end=reference)
            self.files[address] = made_up.correspondences(date).encode()
        self.answer(download.population_totals(), made_up.population_totals())
        for year in made_up.POPULATION_YEARS:
            for first, last in download.AGE_PARTS:
                answer = made_up.population_ages(year, first, last)
                self.answer(download.population_ages(year, first, last), answer)
        description = download.STAT_TAB.format(table=download.ELECTIONS)
        self.files[description] = json.dumps(made_up.elections_description()).encode()
        for year in made_up.ELECTION_YEARS:
            self.answer(download.election(year), made_up.election(year))
        self.answer(download.cattle(), made_up.farms())
        self.answer(download.census(), made_up.census())
        self.files[download.SWISSBOUNDARIES] = made_up.swissboundaries()
        self.answer(download.born_abroad(), made_up.birthplace())
        for sectors in download.JOB_PARTS:
            self.answer(download.jobs(sectors), made_up.jobs(sectors))
        self.answer(download.farms(), made_up.farms("0", "0"))
        self.answer(download.farmland(), made_up.farms("10", "0"))
        self.answer(download.organic_farmland(), made_up.farms("10", "1"))
        self.answer(download.religion(), made_up.religion())
        self.answer(download.education(), made_up.education())
        for rooms in download.ROOM_PARTS:
            self.answer(download.dwellings(rooms), made_up.dwellings(rooms))
        self.answer(download.buildings(), made_up.buildings())

    def answer(self, request: Request, document: dict[str, Any]) -> None:
        assert request.body is not None
        self.queries[(request.address, request.body)] = json.dumps(document).encode()

    def __call__(self, request: Request) -> bytes | None:
        self.requested.append(request.address)
        if request.body is not None and request.address != SPARQL:
            return self.queries.get((request.address, request.body))
        return self.files.get(request.address)


@pytest.fixture(autouse=True)
def no_explanations_asked(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Every address of the explanations answers with a PDF, and nothing goes to the network."""
    asked: list[str] = []

    def probe(address: str) -> str | None:
        asked.append(address)
        return None

    monkeypatch.setattr("pipeline.download.probe_pdf", probe)
    return asked


def project(tmp_path: Path, canton_changes: list[dict[str, Any]] | None = None) -> Path:
    directory = tmp_path / "pipeline"
    directory.mkdir()
    summaries = json.dumps(made_up.summaries(), ensure_ascii=False)
    (directory / "vote-summaries.json").write_text(summaries, encoding="utf-8")
    changes = [MOUTIER] if canton_changes is None else canton_changes
    (directory / "canton-changes.json").write_text(json.dumps(changes), encoding="utf-8")
    (directory / "known-differences.json").write_text("[]", encoding="utf-8")
    return directory


def test_a_run_writes_the_six_kinds_of_data_files(tmp_path: Path) -> None:
    data = tmp_path / "data"
    update(project(tmp_path), data, Sources(), TODAY)
    names = sorted(str(path.relative_to(data)) for path in data.rglob("*.json"))
    assert names == [
        "characteristics.json",
        "map.json",
        "municipalities.json",
        "sources.json",
        "votes.json",
        "votes/5960.json",
        "votes/5990.json",
        "votes/6850.json",
    ]
    assert sorted(path.name for path in tmp_path.iterdir()) == ["data", "pipeline"]


def snapshot(data: Path) -> dict[str, bytes]:
    return {str(path.relative_to(data)): path.read_bytes() for path in data.rglob("*.json")}


def test_a_failing_check_leaves_the_data_files_as_they_were(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    (directory / "canton-changes.json").write_text("[]", encoding="utf-8")
    status = main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data)
    assert status == 1
    assert "feed_20160228.json, vote 5960: the entries of BE sum to" in capsys.readouterr().err
    assert snapshot(data) == before
    assert sorted(path.name for path in tmp_path.iterdir()) == ["data", "pipeline"]


class Unreachable(Sources):
    def __call__(self, request: Request) -> bytes | None:
        if request.address == SPARQL:
            raise SourceError(f"{SPARQL} cannot be reached: <urlopen error timed out>")
        return super().__call__(request)


def test_a_source_that_cannot_be_reached_is_named(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    status = main(["update"], fetch=Unreachable(), today=TODAY, project=directory, data=data)
    assert status == 1
    assert "https://lindas.admin.ch/query cannot be reached" in capsys.readouterr().err
    assert snapshot(data) == before


def test_a_new_vote_day_is_added_and_named(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    earlier = made_up.chancellery()
    earlier["results"]["bindings"].remove(made_up.official_of(earlier, 6850))
    # The summaries of a vote day are written once its results exist (design, decision 7).
    summaries = made_up.summaries()
    del summaries["votes"]["6850"], summaries["days"]["2026-03-08"]
    (directory / "vote-summaries.json").write_text(json.dumps(summaries), encoding="utf-8")
    update(directory, data, Sources(earlier), TODAY)
    assert not (data / "votes" / "6850.json").exists()
    assert main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data) == 1
    assert "no summary of the votes 6850 (2026-03-08)" in capsys.readouterr().err
    (directory / "vote-summaries.json").write_text(
        json.dumps(made_up.summaries()), encoding="utf-8"
    )
    assert main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data) == 0
    assert "added: 6850 (2026-03-08)\n" in capsys.readouterr().out
    assert (data / "votes" / "6850.json").exists()


def test_a_vote_the_chancellery_now_validates_becomes_validated(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    later = Sources(made_up.chancellery(validated=(5960, 5990, 6850)))
    assert main(["update"], fetch=later, today=TODAY, project=directory, data=data) == 0
    assert "validated since the last run: 6850 (2026-03-08)\n" in capsys.readouterr().out
    votes = json.loads((data / "votes.json").read_text(encoding="utf-8"))["votes"]
    vote = next(vote for vote in votes if vote["id"] == 6850)
    assert "validated" not in vote
    assert vote["reference"]["de"] == "BBl 2026 1999"


def test_a_vote_without_a_complete_result_is_named_as_left_out(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    assert main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data) == 0
    assert "left out, no complete result yet: 6900 (2026-11-29)\n" in capsys.readouterr().out
    assert not (data / "votes" / "6900.json").exists()


def test_a_vote_day_in_the_past_without_a_file_stops(tmp_path: Path) -> None:
    # On 2026-11-14 the vote day 2027-02-28 has no file yet, and the run passes (above).
    with pytest.raises(SourceError) as error:
        update(project(tmp_path), tmp_path / "data", Sources(), "2027-03-01")
    assert str(error.value) == (
        f"{FEED.format(day='20270228')}: the BFS has no file for the vote day 2027-02-28"
    )


LINE = {"vote": 5960, "count": "no", "entries": 1, "official": 2, "why": "a reason"}


@pytest.mark.parametrize(
    ("name", "line", "message"),
    [
        ("known-differences.json", LINE | {"count": "maybe"}, "'count' is 'maybe'"),
        ("known-differences.json", LINE | {"vote": "5960"}, "the vote is '5960'"),
        ("known-differences.json", LINE | {"why": ""}, "'why' is ''"),
        ("canton-changes.json", MOUTIER | {"canton": "XX"}, "'canton' is 'XX'"),
        ("canton-changes.json", MOUTIER | {"until": "2025-12"}, "'until' is '2025-12'"),
        ("canton-changes.json", MOUTIER | {"municipality": -1}, "the municipality is -1"),
    ],
)
def test_a_line_of_a_hand_kept_list_that_cannot_be_read_stops(
    tmp_path: Path, name: str, line: dict[str, Any], message: str
) -> None:
    directory = project(tmp_path)
    (directory / name).write_text(json.dumps([line]), encoding="utf-8")
    with pytest.raises(SourceError, match=rf"^{name}, .*{message}"):
        update(directory, tmp_path / "data", Sources(), TODAY)


def test_a_swap_that_fails_leaves_the_data_files_as_they_were(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    rename = Path.rename

    def failing(self: Path, target: Path) -> Path:
        if self.name == "data.new":
            raise OSError("the new directory cannot be moved")
        return rename(self, target)

    monkeypatch.setattr(Path, "rename", failing)
    with pytest.raises(OSError, match="cannot be moved"):
        update(directory, data, Sources(), TODAY)
    assert snapshot(data) == before
    assert sorted(path.name for path in tmp_path.iterdir()) == ["data", "pipeline"]


def test_the_data_files_of_a_run_stopped_between_its_two_moves_are_put_back(
    tmp_path: Path,
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    data.rename(tmp_path / "data.old")
    (directory / "canton-changes.json").write_text("[]", encoding="utf-8")
    with pytest.raises(SourceError):
        update(directory, data, Sources(), TODAY)
    assert snapshot(data) == before
    assert sorted(path.name for path in tmp_path.iterdir()) == ["data", "pipeline"]


def test_a_vote_the_sources_no_longer_give_stops_the_update(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    partial = made_up.chancellery()
    partial["results"]["bindings"].remove(made_up.official_of(partial, 6850))
    status = main(["update"], fetch=Sources(partial), today=TODAY, project=directory, data=data)
    assert status == 1
    assert (
        "the sources no longer give these votes of the data files: 6850 (2026-03-08)"
        in capsys.readouterr().err
    )
    assert snapshot(data) == before


class Sources2027(Sources):
    """The made-up sources on the list of 2027-01-01: same municipalities, a new date."""

    def __init__(self) -> None:
        super().__init__()
        for day in DAYS:
            feed = made_up.feed_day(day)
            for unit in feed["spatial_reference"]:
                unit["spatial_date"] = "2027-01-01"
            self.files[FEED.format(day=day.replace("-", ""))] = json.dumps(feed).encode()
        self.files[REGISTER.format(date="01-01-2027")] = made_up.register().encode()
        for division in ("Commune", "Canton", "Country"):
            address = BOUNDARIES.format(division=division, date="01-01-2027")
            self.files[address] = made_up.boundaries(division, "2027-01-01")
        self.characteristics("01-01-2027")


def test_a_new_list_brings_the_boundaries_of_its_date(tmp_path: Path) -> None:
    data, sources = tmp_path / "data", Sources2027()
    update(project(tmp_path), data, sources, TODAY)
    for division in ("Commune", "Canton", "Country"):
        assert BOUNDARIES.format(division=division, date="01-01-2027") in sources.requested
        assert BOUNDARIES.format(division=division, date="01-01-2026") not in sources.requested
    document = json.loads((data / "map.json").read_text(encoding="utf-8"))
    assert document["referenceDate"] == "2027-01-01"


def test_a_failing_check_of_the_map_leaves_the_data_files_as_they_were(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    without_bern = Sources()
    shapes = [s for s in made_up.boundaries_shapes("Commune") if s[0][2] != 351]
    address = BOUNDARIES.format(division="Commune", date="01-01-2026")
    without_bern.files[address] = made_up.boundaries("Commune", shapes=shapes)
    status = main(["update"], fetch=without_bern, today=TODAY, project=directory, data=data)
    assert status == 1
    assert "no boundary for the municipalities [351]" in capsys.readouterr().err
    assert snapshot(data) == before


def test_the_record_names_the_maps_sources(tmp_path: Path) -> None:
    data = tmp_path / "data"
    update(project(tmp_path), data, Sources(), TODAY)
    record = json.loads((data / "sources.json").read_text(encoding="utf-8"))["sources"]
    addresses = [source["address"] for source in record]
    for division in ("Commune", "Canton", "Country"):
        assert BOUNDARIES.format(division=division, date="01-01-2026") in addresses
    assert THEMAKART in addresses
    themakart = next(source for source in record if source["address"] == THEMAKART)
    assert themakart["bytes"] == len(made_up.themakart())


def test_stat_tab_without_an_answer_leaves_the_data_files_as_they_were(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    silent = Sources()
    request = download.population_totals()
    assert request.body is not None
    del silent.queries[(request.address, request.body)]
    status = main(["update"], fetch=silent, today=TODAY, project=directory, data=data)
    assert status == 1
    assert download.STAT_TAB.format(table=download.POPULATION) in capsys.readouterr().err
    assert snapshot(data) == before


def test_a_run_writes_the_characteristics_on_the_list(tmp_path: Path) -> None:
    data = tmp_path / "data"
    update(project(tmp_path), data, Sources(), TODAY)
    document = json.loads((data / "characteristics.json").read_text(encoding="utf-8"))
    numbers = document["municipalities"]
    assert numbers == sorted(made_up.MUNICIPALITIES)
    # From the year before the first vote day (2016-02-28) and the last election before it.
    assert document["population"]["years"] == list(range(2015, 2026))
    assert [election["year"] for election in document["elections"]] == [2015, 2019, 2023]
    population_2015 = dict(zip(numbers, document["population"]["counts"][0], strict=True))
    affoltern = [made_up.population_groups(n, 2015) for n in (2, 3)]  # Bonstetten merged in
    assert population_2015[2][2:] == [a + b for a, b in zip(*affoltern, strict=True)]
    assert population_2015[6831][0] == sum(made_up.population_groups(700, 2015))
    votes_2015 = dict(zip(numbers, document["elections"][0]["votes"], strict=True))
    assert votes_2015[389] is None
    assert document["area"] == [made_up.AREAS[n][0] for n in numbers]


def test_the_record_names_the_characteristics_sources(tmp_path: Path) -> None:
    data = tmp_path / "data"
    update(project(tmp_path), data, Sources(), TODAY)
    record = json.loads((data / "sources.json").read_text(encoding="utf-8"))["sources"]
    by_address: dict[str, list[dict[str, Any]]] = {}
    for source in record:
        by_address.setdefault(source["address"], []).append(source)
    # The population's totals, and three queries of ages for each year from 2015 to 2025.
    population = by_address[download.STAT_TAB.format(table=download.POPULATION)]
    totals = download.population_totals()
    assert totals.body is not None
    assert totals.body.decode() in [source["query"] for source in population]
    assert len(population) == 1 + 3 * 11
    # The elections: their description (no query) and the three elections from 2015.
    elections = by_address[download.STAT_TAB.format(table=download.ELECTIONS)]
    assert sorted(source["query"] is None for source in elections) == [False] * 3 + [True]
    # The farms table's four answers, the jobs' two, the dwellings' three, and one of each other.
    answers = {
        download.FARMS: 4,
        download.CENSUS_2000: 1,
        download.BIRTHPLACE: 1,
        download.JOBS: 2,
        download.RELIGION_2000: 1,
        download.EDUCATION_2000: 1,
        download.DWELLINGS_2000: 3,
        download.BUILDINGS_2000: 1,
    }
    for table, expected in answers.items():
        given = by_address[download.STAT_TAB.format(table=table)]
        assert len({answer["query"] for answer in given}) == len(given) == expected, table
        assert all(answer["query"] is not None for answer in given)
    assert set(download.LIST_DATES) == {download.POPULATION, download.ELECTIONS, *answers}
    assert REGISTER.format(date="01-01-2024") in by_address
    for date in set(download.LIST_DATES.values()):
        start = "-".join(reversed(date.split("-")))
        assert REGISTER.format(date=start) in by_address
        assert download.CORRESPONDENCES.format(start=start, end="01-01-2026") in by_address
    assert by_address[download.SWISSBOUNDARIES][0]["query"] is None


def test_reused_downloads_do_not_give_the_correspondences_of_another_list(tmp_path: Path) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY, reuse_downloads=True)
    sources = Sources2027()
    # The vote-day files of the new list are fetched again; everything else may be reused.
    for name in (directory / "downloads").glob("feed_*.json"):
        name.unlink()
    update(directory, data, sources, TODAY, reuse_downloads=True)
    for date in set(download.LIST_DATES.values()):
        start = "-".join(reversed(date.split("-")))
        address = download.CORRESPONDENCES.format(start=start, end="01-01-2027")
        assert address in sources.requested


@pytest.mark.parametrize(
    ("years", "message"),
    [
        ("POPULATION_YEARS", "population_totals.json: no figures of the years [2015]"),
        ("ELECTION_YEARS", "elections_description.json: no figures of the elections [2015]"),
        ("FARM_YEARS", "cattle.json: no figures of the years [2015]"),
    ],
)
def test_a_source_without_the_first_year_needed_leaves_the_data_files_as_they_were(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch,
    years: str, message: str,
) -> None:  # fmt: skip
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    # The first vote day is 2016-02-28: the figures of 2015 are the first needed.
    monkeypatch.setattr(made_up, years, [y for y in getattr(made_up, years) if y != 2015])
    status = main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data)
    assert status == 1
    assert message in capsys.readouterr().err
    assert snapshot(data) == before


def characteristics_of(tmp_path: Path, sources: Sources | None = None) -> dict[str, Any]:
    """`characteristics.json` as a run writes it."""
    data = tmp_path / "data"
    update(project(tmp_path), data, sources or Sources(), TODAY)
    document: dict[str, Any] = json.loads(
        (data / "characteristics.json").read_text(encoding="utf-8")
    )
    return document


def added(*rows: list[int]) -> list[int]:
    return [sum(column) for column in zip(*rows, strict=True)]


def test_a_run_writes_the_yearly_counts_of_the_new_tables(tmp_path: Path) -> None:
    document = characteristics_of(tmp_path)
    numbers = document["municipalities"]
    # Each from the year before the first vote day (2016-02-28) to its table's newest.
    assert document["bornAbroad"]["years"] == list(range(2015, 2026))
    assert document["jobs"]["years"] == list(range(2015, 2025))
    assert document["farms"]["years"] == document["cattle"]["years"] == list(range(2015, 2026))
    born_2015 = dict(zip(numbers, document["bornAbroad"]["counts"][0], strict=True))
    # Bonstetten (3) merged into Affoltern am Albis (2); Moutier was 700.
    assert born_2015[2] == made_up.born_abroad(2, 2015) + made_up.born_abroad(3, 2015)
    assert born_2015[6831] == made_up.born_abroad(700, 2015)
    farms_2015 = dict(zip(numbers, document["farms"]["counts"][0], strict=True))
    assert farms_2015[2] == added(made_up.farms_of(2, 2015), made_up.farms_of(3, 2015))
    assert farms_2015[351] == [0, 0, 0]
    jobs_2016 = dict(zip(numbers, document["jobs"]["counts"][1], strict=True))
    assert jobs_2016[2] == added(made_up.jobs_counted(2, 2016), made_up.jobs_counted(3, 2016))
    assert jobs_2016[6831] == made_up.jobs_counted(700, 2016)


def religions_of(number: int) -> list[int]:
    given = made_up.religions(number)
    return [sum(given.values()), given["1"], given["8"], given["17"]]


def education_of(number: int) -> list[int]:
    given = made_up.education_levels(number)
    return [
        given["1"] + given["2"],
        given["3"] + given["4"] + given["5"] + given["6"],
        given["7"] + given["8"] + given["9"] + given["10"],
    ]


def dwellings_of(number: int) -> list[int]:
    sizes = [str(rooms) for rooms in range(1, 11)]

    def occupied(occupants: tuple[str, ...]) -> int:
        return sum(made_up.dwellings_occupied(number, s, o) for s in sizes for o in occupants)

    return [occupied(tuple(made_up.OCCUPANTS)), occupied(("3", "4", "5"))]


def buildings_of(number: int) -> list[int]:
    def built(kinds: tuple[str, ...]) -> int:
        periods = made_up.BUILDING_PERIODS
        return sum(made_up.buildings_built(number, k, p) for k in kinds for p in periods)

    return [built(tuple(made_up.BUILDING_KINDS)), built(("EFH",))]


def test_a_run_writes_the_counts_of_2000_of_the_new_tables(tmp_path: Path) -> None:
    document = characteristics_of(tmp_path)
    numbers = document["municipalities"]
    # Wettswil (4) is split between Aeugst am Albis (1) and Affoltern am Albis (2), which
    # Bonstetten (3) joined: the four are one group, and both have its counts.
    for key, counted in (
        ("religion2000", religions_of),
        ("education2000", education_of),
        ("dwellings2000", dwellings_of),
        ("buildings2000", buildings_of),
    ):
        written = dict(zip(numbers, document[key], strict=True))
        assert written[1] == written[2] == added(*(counted(n) for n in (1, 2, 3, 4))), key
        assert written[351] == counted(351), key
        assert written[6831] == counted(700), key


def test_a_withheld_count_is_written_as_null(tmp_path: Path) -> None:
    document = characteristics_of(tmp_path)
    jobs_2015 = dict(zip(document["municipalities"], document["jobs"]["counts"][0], strict=True))
    meienried = made_up.jobs_counted(389, 2015)
    assert jobs_2015[389] == [meienried[0], meienried[1], None, None]
    # Affoltern am Albis (2) is made of two: the primary sector of Bonstetten (3) is withheld
    # in 2015, so the two have no count of it together; the other three are added up.
    both = added(made_up.jobs_counted(2, 2015), made_up.jobs_counted(3, 2015))
    assert jobs_2015[2] == [both[0], None, both[2], both[3]]
    text = (tmp_path / "data" / "characteristics.json").read_text(encoding="utf-8")
    assert f"[{meienried[0]},{meienried[1]},null,null]" in text


def test_the_jobs_table_on_another_list_stops_the_update(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    sources = Sources()
    for sectors in download.JOB_PARTS:
        document = made_up.jobs(sectors)
        # Bern under another number: 351 is missing, and 8999 is on no list.
        document["dimension"]["Gemeinde"]["category"]["label"]["351"] = "8999 Neudorf"
        sources.answer(download.jobs(sectors), document)
    status = main(["update"], fetch=sources, today=TODAY, project=directory, data=data)
    assert status == 1
    message = (
        "jobs_999.json: its municipalities are not the register's list of 2024-01-01: "
        "not on the list [8999], missing [351]"
    )
    assert message in capsys.readouterr().err
    assert snapshot(data) == before


def test_farms_of_other_years_than_the_cattle_stop_the_update(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # The four answers of the farms table are asked one after the other; the app takes the
    # farms of the cattle's year.
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    sources = Sources()
    monkeypatch.setattr(made_up, "FARM_YEARS", [y for y in made_up.FARM_YEARS if y != 2025])
    sources.answer(download.farms(), made_up.farms("0", "0"))
    sources.answer(download.farmland(), made_up.farms("10", "0"))
    sources.answer(download.organic_farmland(), made_up.farms("10", "1"))
    status = main(["update"], fetch=sources, today=TODAY, project=directory, data=data)
    assert status == 1
    assert "farms.json: no figures of the years [2025]" in capsys.readouterr().err
    assert snapshot(data) == before


def test_the_record_names_the_file_of_the_summaries(
    tmp_path: Path, no_explanations_asked: list[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    records = json.loads((data / "sources.json").read_text(encoding="utf-8"))["sources"]
    named = [r for r in records if r["address"] == "pipeline/vote-summaries.json"]
    content = (directory / "vote-summaries.json").read_bytes()
    assert [(r["bytes"], r["sha256"]) for r in named] == [
        (len(content), hashlib.sha256(content).hexdigest())
    ]
    # The explanations are asked, not read: none of them is a source.
    assert len(no_explanations_asked) == 6
    assert not any("sd-web" in r["address"] for r in records)
    votes = json.loads((data / "votes.json").read_text(encoding="utf-8"))["votes"]
    assert votes[0]["summary"]["it"] == made_up.summary_text(5960, "it")


def test_an_explanation_that_no_longer_answers_stops_the_update(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    update(directory, data, Sources(), TODAY)
    before = snapshot(data)
    address = made_up.explanation_address("2016-02-28", "it")

    def probe(asked: str) -> str | None:
        return "answers with status 404" if asked == address else None

    monkeypatch.setattr("pipeline.download.probe_pdf", probe)
    status = main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data)
    assert status == 1
    assert f"2016-02-28, Italian: {address} answers with status 404" in capsys.readouterr().err
    assert snapshot(data) == before


# The cache of STAT-TAB's answers of final figures (spec characteristics, "The answers of final
# figures are kept" and "The refresh").
STAT_TAB_PREFIX = download.STAT_TAB.split("{", 1)[0]


def kept(directory: Path) -> int:
    """How many answers the cache of the project holds."""
    index = directory / "stat-tab-cache" / "index.json"
    return len(json.loads(index.read_text(encoding="utf-8")))


def stat_tab_asked(sources: Sources) -> int:
    return sum(1 for address in sources.requested if address.startswith(STAT_TAB_PREFIX))


def data_files(data: Path) -> dict[str, bytes]:
    """Every data file but the record of the sources, by its path."""
    return {
        str(path.relative_to(data)): path.read_bytes()
        for path in sorted(data.rglob("*"))
        if path.is_file() and path.name != "sources.json"
    }


def stat_tab_records(data: Path) -> list[dict[str, Any]]:
    records = json.loads((data / "sources.json").read_text(encoding="utf-8"))["sources"]
    return [r for r in records if r["address"].startswith(STAT_TAB_PREFIX) and r["query"]]


def test_a_second_run_takes_the_final_answers_from_the_cache(tmp_path: Path) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    first = Sources()
    update(directory, data, first, TODAY)
    before = data_files(data)
    assert all(record["cached"] is False for record in stat_tab_records(data))
    # The census of 2000 (8 answers), every election but the newest and every year but the newest.
    final = kept(directory)
    assert final > 8
    second = Sources()
    update(directory, data, second, TODAY)
    assert stat_tab_asked(second) == stat_tab_asked(first) - final
    assert data_files(data) == before
    records = stat_tab_records(data)
    assert sum(record["cached"] for record in records) == final
    newest = max(made_up.POPULATION_YEARS)
    assert not any(record["cached"] for record in records if f'"{newest}"' in record["query"])


def test_a_refresh_asks_every_answer(tmp_path: Path) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    first = Sources()
    update(directory, data, first, TODAY)
    again = Sources()
    update(directory, data, again, TODAY, refresh=True)
    assert stat_tab_asked(again) == stat_tab_asked(first)
    assert not any(record["cached"] for record in stat_tab_records(data))


def test_a_changed_query_is_asked_anew(tmp_path: Path) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    first = Sources()
    update(directory, data, first, TODAY)
    index = directory / "stat-tab-cache" / "index.json"
    entries = json.loads(index.read_text(encoding="utf-8"))
    name = min(n for n in entries if n.startswith("population_ages_"))
    entries[name]["query"] = "a query the pipeline no longer sends"
    index.write_text(json.dumps(entries), encoding="utf-8")
    second = Sources()
    update(directory, data, second, TODAY)
    assert stat_tab_asked(second) == stat_tab_asked(first) - kept(directory) + 1
    now = json.loads(index.read_text(encoding="utf-8"))[name]["query"]
    assert now != "a query the pipeline no longer sends"


def test_refresh_and_reuse_downloads_together_are_refused(tmp_path: Path) -> None:
    with pytest.raises(SourceError, match=r"--refresh .* --reuse-downloads .* not both"):
        update(project(tmp_path), tmp_path / "data", Sources(), TODAY, True, refresh=True)


def test_the_report_names_the_answers_from_the_cache(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    data, directory = tmp_path / "data", project(tmp_path)
    assert main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data) == 0
    assert "STAT-TAB answers from the cache: 0 of " in capsys.readouterr().out
    assert main(["update"], fetch=Sources(), today=TODAY, project=directory, data=data) == 0
    assert f"STAT-TAB answers from the cache: {kept(directory)} of " in capsys.readouterr().out
