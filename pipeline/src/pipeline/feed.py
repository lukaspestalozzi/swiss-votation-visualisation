"""Reader of the BFS vote-day files: the votes, their kinds and titles, and their entries.

One file per vote day, from the Federal Statistical Office (BFS):
https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-<yyyymmdd>-eidgAbstimmung.json

Every value is checked where it is read. A value the reader does not understand stops the run
with a message that names the file, the vote and, where there is one, the entry.
"""

import re
from dataclasses import dataclass
from typing import Any

import polars as pl

from pipeline.counts import SourceError, count

# The cantons in the order of the Federal Constitution, art. 1; the BFS numbers them 1 to 26.
CANTONS = (
    "ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR", "SO", "BS", "BL",
    "SH", "AR", "AI", "SG", "GR", "AG", "TG", "TI", "VD", "VS", "NE", "GE", "JU",
)  # fmt: skip
# The BFS's code of the kind of a vote, and the name the calculation gives that kind.
KINDS = {
    1: "mandatory-referendum",
    2: "optional-referendum",
    3: "popular-initiative",
    4: "initiative-with-counter-proposal",
    5: "counter-proposal",
    6: "tie-break-question",
}
LANGUAGES = ("de", "fr", "it")
# The five counts: the name in the data files, the BFS's key, and the name in a message.
COUNTS = (
    ("registered", "anzahlStimmberechtigte", "registered voters"),
    ("cast", "eingelegteStimmzettel", "ballots cast"),
    ("valid", "gueltigeStimmen", "valid ballots"),
    ("yes", "jaStimmenAbsolut", "yes votes"),
    ("no", "neinStimmenAbsolut", "no votes"),
)
_COLUMNS: list[tuple[str, pl.DataType]] = [("canton", pl.Enum(CANTONS)), ("number", pl.Int64())]
ENTRY_SCHEMA = pl.Schema(_COLUMNS + [(name, pl.Int64()) for name, _, _ in COUNTS])


@dataclass(frozen=True)
class Counts:
    """The five counts of an entry, a canton or Switzerland."""

    registered: int
    cast: int
    valid: int
    yes: int
    no: int


@dataclass(frozen=True, eq=False)
class Vote:
    """A vote with a complete result, as the BFS file gives it."""

    id: int
    date: str
    kind: str
    title: dict[str, str]
    passed: bool
    # In favour and against; None where the file gives none.
    cantonal_votes: tuple[float, float] | None
    national: Counts
    cantons: dict[str, Counts]
    # One row per entry, under the canton the file lists it in: the columns of ENTRY_SCHEMA.
    entries: pl.DataFrame


@dataclass(frozen=True)
class LeftOut:
    """A vote of the file without a complete result: scheduled, or still being counted."""

    id: int
    date: str


@dataclass(frozen=True, eq=False)
class Day:
    """The content of one vote-day file."""

    source: str
    date: str
    # The time the file states for itself.
    stated: str
    # The date of the list of municipalities the results are given on.
    reference_date: str
    votes: list[Vote]
    left_out: list[LeftOut]


def _field(document: Any, key: str, where: str) -> Any:
    if not isinstance(document, dict) or key not in document:
        raise SourceError(f"{where}: {key!r} is missing")
    return document[key]


def _list(document: Any, key: str, where: str) -> list[Any]:
    value = _field(document, key, where)
    if not isinstance(value, list):
        raise SourceError(f"{where}: {key!r} is {value!r}, not a list")
    return value


def _text(document: Any, key: str, where: str) -> str:
    value = _field(document, key, where)
    if not isinstance(value, str):
        raise SourceError(f"{where}: {key!r} is {value!r}, not a text")
    return value


def _counts(result: Any, where: str) -> Counts:
    return Counts(*(count(_field(result, key, where), figure, where) for _, key, figure in COUNTS))


def _number(text: str, what: str, where: str) -> int:
    if not re.fullmatch(r"[0-9]+", text):
        raise SourceError(f"{where}: {what} is {text!r}, not a number")
    return int(text)


def _is_complete(vote: Any, where: str) -> bool:
    places = [
        place
        for canton in _list(vote, "kantone", where)
        for place in _list(canton, "gemeinden", where)
    ]
    return (
        _field(vote, "vorlageBeendet", where) is True
        and _field(_field(vote, "resultat", where), "gebietAusgezaehlt", where) is True
        and all(
            _field(_field(place, "resultat", where), "gebietAusgezaehlt", where) is True
            for place in places
        )
    )


def _kind(vote: Any, where: str) -> str:
    code = _field(vote, "vorlagenArtId", where)
    if type(code) is not int or code not in KINDS:
        raise SourceError(f"{where}: the kind of vote has the code {code!r}, not one of 1 to 6")
    # Every kind needs both majorities except the optional referendum (code 2).
    double = _field(vote, "doppeltesMehr", where)
    if double is not (code != 2):
        raise SourceError(
            f"{where}: the kind has the code {code}, and the double majority is {double!r}"
        )
    return KINDS[code]


def _title(titles: dict[str, str], language: str, where: str) -> str:
    title = titles.get(language, "")
    if not title.strip():
        raise SourceError(f"{where}: there is no title in {language!r}")
    return title


# The kinds whose valid ballots are exactly the yes and the no votes; in the other three a voter
# may leave the question unanswered.
ANSWER_REQUIRED = {"mandatory-referendum", "optional-referendum", "popular-initiative"}


def _check_entry(figures: Counts, kind: str, where: str) -> None:
    if figures.valid > figures.cast:
        raise SourceError(
            f"{where}: {figures.valid} valid ballots, more than the {figures.cast} ballots cast"
        )
    if figures.cast > figures.registered:
        raise SourceError(
            f"{where}: {figures.cast} ballots cast, more than the {figures.registered} "
            "registered voters"
        )
    answers = f"{figures.valid} valid ballots, {figures.yes} yes and {figures.no} no votes"
    if kind in ANSWER_REQUIRED and figures.valid != figures.yes + figures.no:
        raise SourceError(f"{where}: {answers}; in a {kind} they must add up")
    if figures.valid < figures.yes + figures.no:
        raise SourceError(f"{where}: {answers}; there are fewer ballots than answers")


def _cantonal_votes(staende: Any, where: str) -> tuple[float, float] | None:
    """In favour and against; None where the file gives none (optional referendums until 2018)."""
    keys = ("jaStaendeGanz", "neinStaendeGanz", "jaStaendeHalb", "neinStaendeHalb")
    values = [_field(staende, key, where) for key in keys]
    if all(value is None for value in values):
        return None
    whole_yes, whole_no, half_yes, half_no = (
        count(value, f"cantonal votes ({key})", where)
        for value, key in zip(values, keys, strict=True)
    )
    return whole_yes + half_yes / 2, whole_no + half_no / 2


def _read_vote(vote: Any, vote_id: int, date: str, where: str) -> Vote:
    kind = _kind(vote, where)
    titles = {
        _text(title, "langKey", where): _text(title, "text", where)
        for title in _list(vote, "vorlagenTitel", where)
    }
    cantons: dict[str, Counts] = {}
    columns: dict[str, list[Any]] = {name: [] for name in ENTRY_SCHEMA.names()}
    for canton in _list(vote, "kantone", where):
        position = _number(_text(canton, "geoLevelnummer", where), "the canton", where)
        if not 1 <= position <= len(CANTONS):
            raise SourceError(f"{where}: the canton is {position}, not one of 1 to 26")
        abbreviation = CANTONS[position - 1]
        cantons[abbreviation] = _counts(
            _field(canton, "resultat", where), f"{where}, {abbreviation}"
        )
        for place in _list(canton, "gemeinden", where):
            number = _number(_text(place, "geoLevelnummer", where), "the entry", where)
            figures = _counts(_field(place, "resultat", where), f"{where}, entry {number}")
            _check_entry(figures, kind, f"{where}, entry {number}")
            columns["canton"].append(abbreviation)
            columns["number"].append(number)
            for name, _, _ in COUNTS:
                columns[name].append(getattr(figures, name))
    passed = _field(vote, "vorlageAngenommen", where)
    if type(passed) is not bool:
        raise SourceError(f"{where}: 'vorlageAngenommen' is {passed!r}, not true or false")
    return Vote(
        id=vote_id,
        date=date,
        kind=kind,
        title={language: _title(titles, language, where) for language in LANGUAGES},
        passed=passed,
        cantonal_votes=_cantonal_votes(_field(vote, "staende", where), where),
        national=_counts(_field(vote, "resultat", where), where),
        cantons=cantons,
        entries=pl.DataFrame(columns, schema=ENTRY_SCHEMA, strict=True),
    )


def read_day(document: Any, source: str) -> Day:
    """Read one vote-day file, already parsed from JSON; `source` names it in messages."""
    day = _text(document, "abstimmtag", source)
    if not re.fullmatch(r"[0-9]{8}", day):
        raise SourceError(f"{source}: the vote day is {day!r}")
    date = f"{day[:4]}-{day[4:6]}-{day[6:]}"
    reference = [
        _text(unit, "spatial_date", source)
        for unit in _list(document, "spatial_reference", source)
        if _field(unit, "spatial_unit", source) == "voge"
    ]
    if len(reference) != 1 or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", reference[0]):
        raise SourceError(
            f"{source}: the reference date of the municipalities is {reference!r}, not one date"
        )
    votes, left_out = [], []
    for vote in _list(_field(document, "schweiz", source), "vorlagen", source):
        vote_id = count(_field(vote, "vorlagenId", source), "the id of a vote", source)
        where = f"{source}, vote {vote_id}"
        if _is_complete(vote, where):
            votes.append(_read_vote(vote, vote_id, date, where))
        else:
            left_out.append(LeftOut(vote_id, date))
    return Day(
        source=source,
        date=date,
        stated=_text(document, "timestamp", source),
        reference_date=reference[0],
        votes=votes,
        left_out=left_out,
    )
