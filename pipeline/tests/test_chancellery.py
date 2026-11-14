from typing import Any

import made_up
import pytest

from pipeline.chancellery import Chancellery, read_chancellery
from pipeline.counts import SourceError

SOURCE = "chancellery.json"


def read(document: dict[str, Any]) -> Chancellery:
    return read_chancellery(document, SOURCE)


def test_a_validated_vote_is_read() -> None:
    vote = read(made_up.chancellery()).votes[5960]
    assert (vote.id, vote.number, vote.date) == (5960, 596, "2016-02-28")
    assert vote.validated is True
    assert (vote.yes, vote.no) == (40830, 39314)
    assert vote.cantonal_votes == (2, 1)
    assert vote.passed is True
    assert vote.reference == {"de": "BBl 2019 4599", "fr": "FF 2019 4421", "it": "FF 2019 3843"}
    assert vote.note == {
        "de": "Das Bundesgericht hat … aufgehoben.",
        "fr": "Le Tribunal fédéral …",
        "it": "Il Tribunale …",
    }


def test_a_vote_without_figures_is_not_validated() -> None:
    vote = read(made_up.chancellery()).votes[6850]
    assert (vote.number, vote.date, vote.validated) == (685, "2026-03-08", False)
    assert (vote.yes, vote.no, vote.cantonal_votes, vote.passed) == (None, None, None, None)
    assert (vote.reference, vote.note) == (None, None)


def test_a_validated_optional_referendum_has_no_cantonal_votes() -> None:
    vote = read(made_up.chancellery()).votes[5990]
    assert vote.validated is True
    assert vote.cantonal_votes is None
    assert vote.note is None


def test_two_rows_with_one_id_stop() -> None:
    document = made_up.chancellery()
    document["results"]["bindings"].append(made_up.official_of(made_up.chancellery(), 5960))
    with pytest.raises(SourceError, match=r"chancellery.json, vote 5960: .*two rows"):
        read(document)


def test_a_validated_vote_without_a_verdict_has_none() -> None:
    document = made_up.chancellery()
    made_up.official_of(document, 5960)["result"]["value"] = made_up.ERGEBNIS + "4"
    # Whether that may be, depends on the kind of the vote: see test_checks.py.
    assert read(document).votes[5960].passed is None


def test_a_validated_vote_without_a_reference_stops() -> None:
    document = made_up.chancellery()
    for key in ("srcde", "srcfr", "srcit"):
        del made_up.official_of(document, 5960)[key]
    with pytest.raises(SourceError, match=r"chancellery.json, vote 5960: .*no reference"):
        read(document)


def test_the_vote_days_are_listed() -> None:
    days = read(made_up.chancellery()).vote_days
    assert days == ["2016-02-28", "2026-03-08", "2026-11-29", "2027-02-28"]
