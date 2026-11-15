import json
from pathlib import Path
from typing import Any

import made_up
import pytest

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
        self.requested: list[str] = []

    def __call__(self, request: Request) -> bytes | None:
        self.requested.append(request.address)
        return self.files.get(request.address)


def project(tmp_path: Path, canton_changes: list[dict[str, Any]] | None = None) -> Path:
    directory = tmp_path / "pipeline"
    directory.mkdir()
    changes = [MOUTIER] if canton_changes is None else canton_changes
    (directory / "canton-changes.json").write_text(json.dumps(changes), encoding="utf-8")
    (directory / "known-differences.json").write_text("[]", encoding="utf-8")
    return directory


def test_a_run_writes_the_five_kinds_of_data_files(tmp_path: Path) -> None:
    data = tmp_path / "data"
    update(project(tmp_path), data, Sources(), TODAY)
    names = sorted(str(path.relative_to(data)) for path in data.rglob("*.json"))
    assert names == [
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
    update(directory, data, Sources(earlier), TODAY)
    assert not (data / "votes" / "6850.json").exists()
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
    assert vote["validated"] is True
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
