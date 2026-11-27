"""The file of the summaries, `pipeline/vote-summaries.json`: a summary of each vote in three
languages and the address of each vote day's explanations of the Federal Council, written by
hand and reviewed (spec vote-summaries; design of add-vote-summaries, decisions 2, 10, 11, 14).

Shape: {"days": {"<date>": {"explanations": {"<lang>": {"address": ..., "language": ...}}}},
        "votes": {"<id>": {"<lang>": "<summary>"}}}
"""

import json
import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pipeline.counts import SourceError

LANGUAGES = {"de": "German", "fr": "French", "it": "Italian"}
SHORTEST, LONGEST = 120, 450
# From this vote day on, the explanations are on www.admin.ch; before, Swissvotes keeps copies.
FIRST_ON_ADMIN = "2015-06-14"
ADMIN, SWISSVOTES = "https://www.admin.ch/", "https://swissvotes.ch/"
DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
# A line break, markup, a link or a double space: a summary is one paragraph of plain text.
NOT_PLAIN = re.compile(r"[\n\r\t<>]|https?:|www\.|  ")
# Numbers as the screen writes them (spec vote-summaries, "How a summary writes numbers").
NOT_AS_ON_SCREEN = {
    "a decimal comma": re.compile(r"[0-9],[0-9]"),
    "digits parted by a space": re.compile(r"[0-9][ \u00a0\u202f][0-9]{3}(?![0-9])"),
    "five digits or more in a row": re.compile(r"[0-9]{5}"),
}
# A French sign without the space the Confederation puts beside it (spec vote-summaries, "The
# spaces of a French summary"): a no-break space before ":" and "»" and after "«", a narrow one
# before ";", "?" and "!".
FRENCH_SIGN = re.compile(r"(?<!\u00a0)[:»]|(?<!\u202f)[;?!]|«(?!\u00a0)")

# Answers None when an address answers with a PDF, else what is wrong with it.
Probe = Callable[[str], str | None]


@dataclass(frozen=True)
class Explanation:
    """Where a vote day's explanations are for one language, and the document's language."""

    address: str
    language: str


@dataclass(frozen=True)
class Summaries:
    # By vote day, then by language of the page.
    days: dict[str, dict[str, Explanation]]
    # By vote id, then by language.
    votes: dict[int, dict[str, str]]


def _object(value: Any, where: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise SourceError(f"{where}: not an object")
    return value


def _explanation(date: str, language: str, value: Any, name: str) -> Explanation:
    where = f"{name}, {date}, {LANGUAGES[language]}"
    if value is None:
        raise SourceError(f"{where}: no explanations")
    row = _object(value, where)
    address, document = row.get("address"), row.get("language")
    if document not in LANGUAGES:
        raise SourceError(f"{where}: the language is {document!r}")
    host, server = (
        (ADMIN, "www.admin.ch") if date >= FIRST_ON_ADMIN else (SWISSVOTES, "swissvotes.ch")
    )
    if not isinstance(address, str) or not address.startswith(host):
        raise SourceError(f"{where}: {address} is not on {server}")
    return Explanation(address, document)


def _summary(vote: str, language: str, text: Any, name: str) -> str:
    where = f"{name}, vote {vote}, {LANGUAGES[language]}"
    if not isinstance(text, str) or not text:
        raise SourceError(f"{where}: no summary")
    if not SHORTEST <= len(text) <= LONGEST:
        raise SourceError(f"{where}: {len(text)} characters, not {SHORTEST} to {LONGEST}")
    if NOT_PLAIN.search(text) or text != text.strip():
        raise SourceError(f"{where}: not plain text")
    for problem, pattern in NOT_AS_ON_SCREEN.items():
        if found := pattern.search(text):
            raise SourceError(f"{where}: {problem}, {found.group()!r}")
    if language == "fr" and (found := FRENCH_SIGN.search(text)):
        raise SourceError(f"{where}: {found.group()!r} without its space")
    return text


def read_summaries(content: bytes, name: str) -> Summaries:
    """The summaries and the addresses, each checked for its form; nothing is requested."""
    try:
        document = _object(json.loads(content.decode("utf-8")), name)
    except ValueError as error:
        raise SourceError(f"{name}: not JSON: {error}") from error
    days: dict[str, dict[str, Explanation]] = {}
    for date, day in sorted(_object(document.get("days"), f"{name}, days").items()):
        if not DATE.fullmatch(date):
            raise SourceError(f"{name}: {date!r} is not a date")
        given = _object(_object(day, f"{name}, {date}").get("explanations"), f"{name}, {date}")
        days[date] = {
            language: _explanation(date, language, given.get(language), name)
            for language in LANGUAGES
        }
    votes: dict[int, dict[str, str]] = {}
    for vote, texts in _object(document.get("votes"), f"{name}, votes").items():
        if not vote.isdigit():
            raise SourceError(f"{name}: {vote!r} is not the id of a vote")
        given = _object(texts, f"{name}, vote {vote}")
        votes[int(vote)] = {
            language: _summary(vote, language, given.get(language), name) for language in LANGUAGES
        }
    return Summaries(days, votes)


def check_coverage(summaries: Summaries, votes: list[tuple[int, str]], name: str) -> None:
    """A summary for every vote and none more; explanations for every vote day and none more."""
    missing = [f"{i} ({date})" for i, date in sorted(votes) if i not in summaries.votes]
    if missing:
        raise SourceError(f"{name}: no summary of the votes {', '.join(missing)}")
    ids = {i for i, _ in votes}
    for vote in sorted(summaries.votes):
        if vote not in ids:
            raise SourceError(f"{name}: a summary of {vote}, which is not among the votes")
    dates = {date for _, date in votes}
    for date in sorted(dates - summaries.days.keys()):
        raise SourceError(f"{name}: no explanations of {date}")
    for date in sorted(summaries.days.keys() - dates):
        raise SourceError(f"{name}: explanations of {date}, which has no vote")


def check_explanations(summaries: Summaries, probe: Probe) -> None:
    """Every address answers with a PDF; asked in the order of the days and the languages."""
    for date, explanations in sorted(summaries.days.items()):
        for language, explanation in explanations.items():
            problem = probe(explanation.address)
            if problem is not None:
                raise SourceError(
                    f"the explanations of {date}, {LANGUAGES[language]}: "
                    f"{explanation.address} {problem}"
                )
