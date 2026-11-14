"""Reader of the Federal Chancellery's national results: the official result of each vote.

The Chancellery publishes the results the Federal Council validated as linked data:
https://lindas.admin.ch/query (SPARQL), data set
https://politics.ld.admin.ch/political-rights/popular-vote/. `download.py` holds the query; its
answer has one row per national result, keyed by the BFS's id of the vote. The Chancellery
writes "" for a figure it does not give, for example before a vote is validated.
"""

import re
from dataclasses import dataclass
from typing import Any

from pipeline.counts import SourceError, count

# The end of the address of the Chancellery's `ergebnis`: accepted, rejected. Other codes mean
# that no verdict is given (a date fixed, a validation in preparation).
VERDICTS = {"1": True, "2": False}
LANGUAGES = ("de", "fr", "it")


@dataclass(frozen=True)
class Official:
    """One row of the Chancellery: a vote, validated or not."""

    id: int
    number: int
    date: str
    # Validated: the Chancellery gives the yes and the no votes.
    validated: bool
    yes: int | None
    no: int | None
    # In favour and against; None where the Chancellery gives none.
    cantonal_votes: tuple[float, float] | None
    # Accepted, rejected, or None where the Chancellery gives neither.
    passed: bool | None
    # The publication in the Federal Gazette and the note, in German, French and Italian.
    reference: dict[str, str] | None
    note: dict[str, str] | None


@dataclass(frozen=True)
class Chancellery:
    """The Chancellery's answer: its votes by the BFS's id, and its vote days."""

    votes: dict[int, Official]
    vote_days: list[str]


def _value(row: Any, key: str, where: str) -> str | None:
    """The text of a variable; None where it is missing or empty."""
    if not isinstance(row, dict):
        raise SourceError(f"{where}: a row is {row!r}")
    if key not in row:
        return None
    cell = row[key]
    if not isinstance(cell, dict) or not isinstance(cell.get("value"), str):
        raise SourceError(f"{where}: {key!r} is {cell!r}")
    text: str = cell["value"]
    return text or None


def _whole(text: str | None, figure: str, where: str) -> int | None:
    if text is None:
        return None
    return count(int(text) if re.fullmatch(r"[0-9]+", text) else text, figure, where)


def _cantonal_votes(row: Any, where: str) -> tuple[float, float] | None:
    texts = [_value(row, key, where) for key in ("cy", "cn")]
    if texts == [None, None]:
        return None
    sides = []
    for text in texts:
        if text is None or not re.fullmatch(r"[0-9]+(\.[05])?", text) or float(text) > 23:
            raise SourceError(f"{where}: the cantonal votes are {texts!r}")
        sides.append(float(text))
    return sides[0], sides[1]


def _in_languages(row: Any, prefix: str, where: str) -> dict[str, str] | None:
    texts = {language: _value(row, prefix + language, where) for language in LANGUAGES}
    if all(text is None for text in texts.values()):
        return None
    given = {language: text for language, text in texts.items() if text is not None}
    if len(given) != len(LANGUAGES):
        raise SourceError(f"{where}: {prefix!r} is given in {sorted(given)} only")
    return given


def _read_row(row: Any, source: str) -> Official:
    vote_id = _whole(_value(row, "id", source), "the id of a vote", source)
    if vote_id is None:
        raise SourceError(f"{source}: a row has no id")
    where = f"{source}, vote {vote_id}"
    number = _whole(_value(row, "number", where), "the number of the vote", where)
    date = _value(row, "date", where)
    if number is None or date is None or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", date):
        raise SourceError(f"{where}: the number is {number!r} and the date {date!r}")
    yes = _whole(_value(row, "yes", where), "yes votes", where)
    no = _whole(_value(row, "no", where), "no votes", where)
    if (yes is None) != (no is None):
        raise SourceError(f"{where}: {yes!r} yes and {no!r} no votes; one without the other")
    if yes is None:
        return Official(vote_id, number, date, False, None, None, None, None, None, None)
    result = _value(row, "result", where) or ""
    reference = _in_languages(row, "src", where)
    if reference is None:
        raise SourceError(f"{where}: the vote is validated and has no reference to its publication")
    return Official(
        id=vote_id,
        number=number,
        date=date,
        validated=True,
        yes=yes,
        no=no,
        cantonal_votes=_cantonal_votes(row, where),
        passed=VERDICTS.get(result.rsplit("/", 1)[-1]),
        reference=reference,
        note=_in_languages(row, "note", where),
    )


def read_chancellery(document: Any, source: str) -> Chancellery:
    """Read the Chancellery's answer, already parsed from JSON; `source` names it in messages."""
    results = document.get("results") if isinstance(document, dict) else None
    rows = results.get("bindings") if isinstance(results, dict) else None
    if not isinstance(rows, list):
        raise SourceError(f"{source}: the answer has no rows")
    votes: dict[int, Official] = {}
    for row in rows:
        official = _read_row(row, source)
        if official.id in votes:
            raise SourceError(f"{source}, vote {official.id}: the answer has two rows for it")
        votes[official.id] = official
    return Chancellery(votes=votes, vote_days=sorted({vote.date for vote in votes.values()}))
