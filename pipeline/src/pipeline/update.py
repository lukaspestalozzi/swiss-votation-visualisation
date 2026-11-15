"""The update: download the sources, read and check them, and write the data files.

The data files are replaced only when every check has passed; on any failure they stay as they
were. The steps are decision 13 of the design of the change add-vote-data.
"""

import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pipeline.chancellery import read_chancellery
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
from pipeline.download import FEED, REGISTER, Fetch, Request, chancellery_request
from pipeline.feed import CANTONS, Day, read_day
from pipeline.register import read_register
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

    def record(self, address: str, content: bytes, stated: str | None) -> None:
        self.sources.append(Source(address, content, stated))


def _previous(data: Path) -> dict[int, bool]:
    """The votes of the data files as they are, with whether each is validated."""
    path = data / "votes.json"
    if not path.exists():
        return {}
    return {vote["id"]: vote["validated"] for vote in json.loads(path.read_text())["votes"]}


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
    content = downloads.get(request, "chancellery.json")
    if content is None:
        raise SourceError(f"{request.address}: the Federal Chancellery gives no answer")
    downloads.record(request.address, content, None)
    chancellery = read_chancellery(_json(content, "chancellery.json"), "chancellery.json")

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
    _replace(data, Data(reference, votes, municipalities, swiss_abroad, downloads.sources))
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
            if vote.official.validated and previous.get(vote.vote.id) is False
        ],
        left_out=[_named(vote.id, vote.date) for day in days for vote in day.left_out],
    )


def _named(vote_id: int, date: str) -> str:
    return f"{vote_id} ({date})"
