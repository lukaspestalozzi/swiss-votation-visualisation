"""The data files of the app, written from the sources once every check has passed.

In the directory given (the app's `static/data/`), as UTF-8 JSON, the same bytes for the same
sources: no time of the run is written.

- `votes.json`: the list of votes, one vote per line.
- `votes/<id>.json`: the entries of one vote, one canton per line.
- `municipalities.json`: the list of municipalities and the Swiss abroad, one canton per line.
- `map.json`: the map's shapes, one municipality, canton or lake per line.
- `characteristics.json`: the counts of the characteristics, one year or election per line.
- `sources.json`: the source files the data was made from.

The shape of each file is decision 12 of the design of the change add-vote-data, and for
`map.json` decision 14 of the design of the change add-result-map, for `characteristics.json`
decision 12 of the design of the change add-characteristics.
"""

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import polars as pl

from pipeline.boundaries import MapData
from pipeline.chancellery import Official
from pipeline.characteristics import CharacteristicsData
from pipeline.download import ELECTION_DAYS
from pipeline.feed import CANTONS, Vote
from pipeline.register import Municipality


@dataclass(frozen=True)
class Source:
    """A source file: its address, its content, the time it states for itself, if any, and for
    an answer to a query, the query (the body of the request)."""

    address: str
    content: bytes
    stated: str | None
    query: str | None = None


@dataclass(frozen=True, eq=False)
class VoteData:
    """A vote that has passed every check, with what the data files need of it."""

    vote: Vote
    official: Official
    # The entries, each under the canton it voted in.
    entries: pl.DataFrame
    without_result: list[int]


@dataclass(frozen=True, eq=False)
class Data:
    """Everything the data files hold."""

    reference_date: str
    votes: list[VoteData]
    municipalities: list[Municipality]
    # The canton and the number of its Swiss abroad, for every canton that counts them apart.
    swiss_abroad: dict[str, int]
    sources: list[Source]
    map: MapData
    characteristics: CharacteristicsData


def _dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _result(data: VoteData) -> dict[str, Any]:
    """The Federal Chancellery's result once validated, the BFS's until then."""
    vote, official = data.vote, data.official
    if official.validated:
        yes, no, cantonal_votes, passed = (
            official.yes,
            official.no,
            official.cantonal_votes,
            official.passed,
        )
    else:
        yes, no = vote.national.yes, vote.national.no
        cantonal_votes, passed = vote.cantonal_votes, vote.passed
    in_favour, against = cantonal_votes or (None, None)
    return {
        "yes": yes,
        "no": no,
        "cantonalVotesInFavour": in_favour,
        "cantonalVotesAgainst": against,
        # A tie-break question has no verdict.
        "passed": None if vote.kind == "tie-break-question" else passed,
    }


def _listing(data: VoteData) -> dict[str, Any]:
    vote, official, entries = data.vote, data.official, data.entries
    return {
        "id": vote.id,
        "number": official.number,
        "date": vote.date,
        "kind": vote.kind,
        "title": vote.title,
        "validated": official.validated,
        "result": _result(data),
        "reference": official.reference if official.validated else None,
        "note": official.note if official.validated else None,
        "sums": {
            "registered": int(entries["registered"].sum()),
            "cast": int(entries["cast"].sum()),
            "validBallots": int(entries["valid"].sum()),
            "yes": int(entries["yes"].sum()),
            "no": int(entries["no"].sum()),
        },
    }


def _votes_json(data: Data) -> str:
    votes = sorted(data.votes, key=lambda vote: (vote.vote.date, vote.vote.id))
    lines = ",\n".join(f"    {_dumps(_listing(vote))}" for vote in votes)
    return (
        f'{{\n  "referenceDate": {_dumps(data.reference_date)},\n  "votes": [\n{lines}\n  ]\n}}\n'
    )


def _by_canton(rows: list[list[Any]]) -> str:
    """One line per canton, all 26 in the order of the constitution; rows given as [canton, ...]."""
    grouped: dict[str, list[list[Any]]] = {canton: [] for canton in CANTONS}
    for canton, *row in rows:
        grouped[canton].append(row)
    return ",\n".join(
        f"    {_dumps(canton)}: {json.dumps(grouped[canton], ensure_ascii=False, separators=(',', ':'))}"
        for canton in CANTONS
    )


def _vote_json(data: VoteData) -> str:
    entries = data.entries.sort("number")
    rows = entries.select("canton", "number", "registered", "cast", "valid", "yes", "no").rows()
    return (
        "{\n"
        f'  "id": {data.vote.id},\n'
        f'  "entries": {{\n{_by_canton([list(row) for row in rows])}\n  }},\n'
        f'  "withoutResult": {_dumps(sorted(data.without_result))}\n'
        "}\n"
    )


def _municipalities_json(data: Data) -> str:
    rows = [
        [m.canton, m.number, m.name] for m in sorted(data.municipalities, key=lambda m: m.number)
    ]
    abroad = {
        canton: data.swiss_abroad[canton] for canton in CANTONS if canton in data.swiss_abroad
    }
    return (
        "{\n"
        f'  "referenceDate": {_dumps(data.reference_date)},\n'
        f'  "municipalities": {{\n{_by_canton(rows)}\n  }},\n'
        f'  "swissAbroad": {_dumps(abroad)}\n'
        "}\n"
    )


def _lines(values: list[Any]) -> str:
    return ",\n".join(f"    {_dumps(value)}" for value in values)


def _map_json(data: Data) -> str:
    shapes = data.map
    return (
        "{\n"
        f'  "referenceDate": {_dumps(data.reference_date)},\n'
        f'  "lakesSet": {shapes.lakes_set},\n'
        f'  "width": {shapes.frame.width},\n'
        f'  "height": {shapes.frame.height},\n'
        f'  "municipalities": [\n{_lines([list(m) for m in shapes.municipalities])}\n  ],\n'
        f'  "cantons": [\n{_lines([list(c) for c in shapes.cantons])}\n  ],\n'
        f'  "outline": {_dumps(shapes.outline)},\n'
        f'  "lakes": [\n{_lines(shapes.lakes)}\n  ]\n'
        "}\n"
    )


def _compact(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _characteristics_json(data: Data) -> str:
    """Each array follows the list's numbers; one line per year and per election."""
    found = data.characteristics
    numbers = sorted(found.municipalities)

    def yearly(by_year: dict[int, dict[int, Any]]) -> str:
        years = sorted(by_year)
        lines = ",\n".join(f"    {_compact([by_year[y][n] for n in numbers])}" for y in years)
        return f'{{"years": {_dumps(years)}, "counts": [\n{lines}\n  ]}}'

    elections = ",\n".join(
        f'    {{"year": {year}, "day": {_dumps(ELECTION_DAYS[year])}, '
        f'"votes": {_compact([found.elections[year][n] for n in numbers])}}}'
        for year in sorted(found.elections)
    )
    return (
        "{\n"
        f'  "referenceDate": {_dumps(data.reference_date)},\n'
        f'  "municipalities": {_dumps(numbers)},\n'
        f'  "population": {yearly(found.population)},\n'
        f'  "elections": [\n{elections}\n  ],\n'
        f'  "cattle": {yearly(found.cattle)},\n'
        f'  "languages2000": {_compact([found.languages[n] for n in numbers])},\n'
        f'  "area": {_compact([found.areas[n] for n in numbers])}\n'
        "}\n"
    )


def _sources_json(data: Data) -> str:
    records = [
        {
            "address": source.address,
            "bytes": len(source.content),
            "sha256": hashlib.sha256(source.content).hexdigest(),
            "stated": source.stated,
            "query": source.query,
        }
        for source in sorted(data.sources, key=lambda source: (source.address, source.query or ""))
    ]
    lines = ",\n".join(f"    {_dumps(record)}" for record in records)
    return f'{{\n  "sources": [\n{lines}\n  ]\n}}\n'


def write_data(directory: Path, data: Data) -> None:
    """Write all data files into `directory`, which must exist."""
    (directory / "votes.json").write_text(_votes_json(data), encoding="utf-8")
    (directory / "votes").mkdir()
    for vote in data.votes:
        (directory / "votes" / f"{vote.vote.id}.json").write_text(
            _vote_json(vote), encoding="utf-8"
        )
    (directory / "municipalities.json").write_text(_municipalities_json(data), encoding="utf-8")
    (directory / "map.json").write_text(_map_json(data), encoding="utf-8")
    (directory / "characteristics.json").write_text(_characteristics_json(data), encoding="utf-8")
    (directory / "sources.json").write_text(_sources_json(data), encoding="utf-8")
