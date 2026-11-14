"""The checks between the sources: the entries against the list, the sums, the official result.

They add up and compare; none of them applies a voting rule. Cantonal votes and verdicts are
calculated only by the calculation module, which a test of the app runs over the data files.
"""

from dataclasses import dataclass

import polars as pl

from pipeline.chancellery import Chancellery
from pipeline.counts import SourceError
from pipeline.feed import CANTONS, COUNTS, Day, Vote
from pipeline.register import Municipality


@dataclass(frozen=True)
class Entries:
    """What the entries of a vote are, measured against the list of municipalities."""

    # The canton and the number of its Swiss abroad, for the cantons that count them apart.
    swiss_abroad: dict[str, int]
    # The municipalities of the list without an entry in the vote, by number.
    without_result: list[int]


# The numbers the BFS gives the Swiss abroad of each canton: 9010 for ZH, ... 9260 for JU.
SWISS_ABROAD = {9000 + 10 * position: canton for position, canton in enumerate(CANTONS, 1)}


def _swiss_abroad_number() -> pl.Expr:
    """The number the BFS gives the Swiss abroad of the entry's canton: 9010 for ZH, ... 9260."""
    return 9000 + 10 * (pl.col("canton").to_physical().cast(pl.Int64) + 1)


def check_entries(vote: Vote, municipalities: list[Municipality], source: str) -> Entries:
    """Every entry is a municipality of the list or the Swiss abroad of its canton."""
    where = f"{source}, vote {vote.id}"
    twice = vote.entries.filter(pl.col("number").is_duplicated())
    if twice.height:
        raise SourceError(f"{where}: the entry {twice['number'][0]} appears twice")
    numbers = [municipality.number for municipality in municipalities]
    entries = vote.entries.with_columns(
        is_municipality=pl.col("number").is_in(numbers),
        is_swiss_abroad=pl.col("number") == _swiss_abroad_number(),
    )
    unknown = entries.filter(~pl.col("is_municipality") & ~pl.col("is_swiss_abroad"))
    if unknown.height:
        number, canton = unknown.row(0)[1], unknown.row(0)[0]
        if number in SWISS_ABROAD:
            raise SourceError(
                f"{where}: the entry {number} is the Swiss abroad of {SWISS_ABROAD[number]}, "
                f"listed under {canton}"
            )
        raise SourceError(
            f"{where}: the entry {number} is neither a municipality of the list nor the Swiss "
            f"abroad of {canton}"
        )
    abroad = entries.filter("is_swiss_abroad")
    present = set(entries["number"].to_list())
    return Entries(
        swiss_abroad=dict(zip(abroad["canton"].to_list(), abroad["number"].to_list(), strict=True)),
        without_result=[number for number in numbers if number not in present],
    )


def reference_date(days: list[Day]) -> str:
    """The one date whose list of municipalities all vote-day files use."""
    dates = {day.reference_date for day in days}
    if len(dates) != 1:
        listed = ", ".join(f"{day.source}: {day.reference_date}" for day in days)
        raise SourceError(f"the vote-day files do not all use one list of municipalities: {listed}")
    return dates.pop()


@dataclass(frozen=True)
class CantonChange:
    """A municipality that changed canton: its earlier canton, and its last day there."""

    municipality: int
    canton: str
    until: str


def counted_for(vote: Vote, changes: list[CantonChange]) -> pl.DataFrame:
    """The entries of a vote, each under the canton whose result it was part of that day.

    The BFS files list every entry under its canton of today; the list of changes moves a
    municipality back to its earlier canton for the votes up to its last day there.
    """
    entries = vote.entries
    for change in changes:
        if vote.date <= change.until:
            entries = entries.with_columns(
                canton=pl.when(pl.col("number") == change.municipality)
                .then(pl.lit(change.canton))
                .otherwise(pl.col("canton"))
                .cast(entries.schema["canton"])
            )
    return entries


def check_canton_sums(vote: Vote, entries: pl.DataFrame, source: str) -> None:
    """The entries of each canton sum to the canton's five counts in the BFS file."""
    sums = entries.group_by("canton").agg(pl.col(name).sum() for name, _, _ in COUNTS)
    by_canton = {row["canton"]: row for row in sums.iter_rows(named=True)}
    for canton, expected in vote.cantons.items():
        for name, _, figure in COUNTS:
            got = by_canton[canton][name] if canton in by_canton else 0
            if got != getattr(expected, name):
                raise SourceError(
                    f"{source}, vote {vote.id}: the entries of {canton} sum to {got} {figure}, "
                    f"the file gives {getattr(expected, name)} for the canton"
                )


def check_national_sums(vote: Vote, entries: pl.DataFrame, source: str) -> None:
    """The entries sum to the five counts the BFS file gives for Switzerland."""
    for name, _, figure in COUNTS:
        got, expected = int(entries[name].sum()), getattr(vote.national, name)
        if got != expected:
            raise SourceError(
                f"{source}, vote {vote.id}: the entries sum to {got} {figure}, "
                f"the file gives {expected} for Switzerland"
            )


@dataclass(frozen=True)
class KnownDifference:
    """A difference between the entries and the official result that is written down."""

    vote: int
    # "yes" or "no"
    count: str
    entries: int
    official: int


def _verdict(passed: bool | None) -> str:
    return {True: "accepted", False: "rejected", None: "neither accepted nor rejected"}[passed]


def _sides(cantonal_votes: tuple[float, float] | None) -> str:
    in_favour, against = cantonal_votes or (None, None)
    return f"{in_favour} to {against}"


def check_official(
    votes: list[Vote],
    chancellery: Chancellery,
    known: list[KnownDifference],
) -> None:
    """The votes of the BFS files against the Federal Chancellery's validated results."""
    complete = {vote.id for vote in votes}
    for result in chancellery.votes.values():
        if result.validated and result.id not in complete:
            raise SourceError(
                f"vote {result.id}: the Federal Chancellery has validated it, and the BFS file "
                "has no complete result for it"
            )
    occurring: list[KnownDifference] = []
    for vote in votes:
        if vote.id not in chancellery.votes:
            raise SourceError(
                f"vote {vote.id} of {vote.date}: the Federal Chancellery has no row for it"
            )
        result = chancellery.votes[vote.id]
        if not result.validated:
            continue
        for name, official in (("yes", result.yes), ("no", result.no)):
            entries = getattr(vote.national, name)
            if entries != official and official is not None:
                difference = KnownDifference(vote.id, name, entries, official)
                if difference in known:
                    occurring.append(difference)
                    continue
                raise SourceError(
                    f"vote {vote.id}: the entries sum to {entries} {name} votes, the Federal "
                    f"Chancellery gives {official}"
                )
        if vote.kind != "tie-break-question" and result.passed != vote.passed:
            raise SourceError(
                f"vote {vote.id}: the Federal Chancellery gives it as {_verdict(result.passed)}, "
                f"the BFS file as {_verdict(vote.passed)}"
            )
        both = (result.cantonal_votes, vote.cantonal_votes)
        if None not in both and both[0] != both[1]:
            raise SourceError(
                f"vote {vote.id}: the Federal Chancellery gives the cantonal votes as "
                f"{_sides(both[0])}, the BFS file as {_sides(both[1])}"
            )
    for line in known:
        if line not in occurring:
            raise SourceError(
                "the list of known differences has a line the sources do not show: "
                f"vote {line.vote}, {line.count} votes, {line.entries} in the entries, "
                f"{line.official} officially"
            )
