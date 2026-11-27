import json
from typing import Any

import made_up
import pytest

from pipeline.counts import SourceError
from pipeline.summaries import (
    Explanation,
    check_coverage,
    check_explanations,
    read_summaries,
)

NAME = "vote-summaries.json"


def read(document: dict[str, Any]) -> Any:
    return read_summaries(json.dumps(document).encode(), NAME)


def test_the_summaries_and_explanations_are_read() -> None:
    found = read(made_up.summaries())
    assert found.votes[5960]["fr"] == made_up.summary_text(5960, "fr")
    assert found.days["2016-02-28"]["it"] == Explanation(
        made_up.explanation_address("2016-02-28", "it"), "it"
    )


def test_a_summary_too_long() -> None:
    document = made_up.summaries()
    document["votes"]["5960"]["fr"] = "x" * 451
    with pytest.raises(SourceError, match=r"vote 5960, French: 451 characters"):
        read(document)


def test_a_summary_too_short_or_missing() -> None:
    document = made_up.summaries()
    document["votes"]["5960"]["it"] = "x" * 119
    with pytest.raises(SourceError, match=r"vote 5960, Italian: 119 characters"):
        read(document)
    del document["votes"]["5960"]["it"]
    with pytest.raises(SourceError, match=r"vote 5960, Italian: no summary"):
        read(document)


def test_a_summary_with_a_line_break() -> None:
    document = made_up.summaries()
    text = made_up.summary_text(5960, "de")
    document["votes"]["5960"]["de"] = text[:60] + "\n" + text[61:]
    with pytest.raises(SourceError, match=r"vote 5960, German: not plain text"):
        read(document)


@pytest.mark.parametrize("piece", ["<b>", "https://www.admin.ch", "  "])
def test_a_summary_with_markup_a_link_or_a_double_space(piece: str) -> None:
    document = made_up.summaries()
    text = made_up.summary_text(5960, "de")
    document["votes"]["5960"]["de"] = text[:60] + piece + text[60:]
    with pytest.raises(SourceError, match=r"vote 5960, German: not plain text"):
        read(document)


def test_an_address_on_another_server() -> None:
    document = made_up.summaries()
    address = "https://swissvotes.ch/vote/596.00/brochure-de.pdf"
    document["days"]["2016-02-28"]["explanations"]["de"]["address"] = address
    with pytest.raises(SourceError, match=rf"2016-02-28, German: {address} is not on www.admin.ch"):
        read(document)


def test_an_early_vote_day_takes_swissvotes_copies() -> None:
    document = made_up.summaries()
    document["days"]["2014-02-09"] = {
        "explanations": {
            "de": {
                "address": "https://swissvotes.ch/vote/578.00/brochure-de.pdf",
                "language": "de",
            },
            "fr": {
                "address": "https://swissvotes.ch/vote/578.00/brochure-fr.pdf",
                "language": "fr",
            },
            "it": {
                "address": "https://swissvotes.ch/vote/578.00/brochure-fr.pdf",
                "language": "fr",
            },
        }
    }
    found = read(document)
    assert found.days["2014-02-09"]["it"].language == "fr"
    address = "https://example.org/brochure-de.pdf"
    document["days"]["2014-02-09"]["explanations"]["de"]["address"] = address
    with pytest.raises(
        SourceError, match=rf"2014-02-09, German: {address} is not on swissvotes.ch"
    ):
        read(document)


def test_an_explanation_without_its_language_or_in_none_of_the_three() -> None:
    document = made_up.summaries()
    document["days"]["2016-02-28"]["explanations"]["fr"]["language"] = "rm"
    with pytest.raises(SourceError, match=r"2016-02-28, French: the language is 'rm'"):
        read(document)
    del document["days"]["2016-02-28"]["explanations"]["fr"]
    with pytest.raises(SourceError, match=r"2016-02-28, French: no explanations"):
        read(document)


VOTES = [(vote_id, date) for vote_id, date in made_up.SUMMARY_VOTES.items()]


def test_every_vote_has_a_summary_and_every_summary_a_vote() -> None:
    check_coverage(read(made_up.summaries()), VOTES, NAME)


def test_a_new_vote_day_without_its_summaries() -> None:
    votes = [*VOTES, (6890, "2026-11-29"), (6900, "2026-11-29")]
    with pytest.raises(
        SourceError, match=r"no summary of the votes 6890 \(2026-11-29\), 6900 \(2026-11-29\)"
    ):
        check_coverage(read(made_up.summaries()), votes, NAME)


def test_a_summary_for_no_vote() -> None:
    document = made_up.summaries()
    document["votes"]["9990"] = document["votes"]["5960"]
    with pytest.raises(SourceError, match=r"a summary of 9990, which is not among the votes"):
        check_coverage(read(document), VOTES, NAME)


def test_explanations_of_a_day_without_a_vote() -> None:
    document = made_up.summaries()
    document["days"]["2025-02-09"] = document["days"]["2016-02-28"]
    with pytest.raises(SourceError, match=r"explanations of 2025-02-09, which has no vote"):
        check_coverage(read(document), VOTES, NAME)


def test_every_address_is_asked_once() -> None:
    asked: list[str] = []

    def probe(address: str) -> str | None:
        asked.append(address)
        return None

    check_explanations(read(made_up.summaries()), probe)
    assert asked == [
        made_up.explanation_address(date, language)
        for date in ("2016-02-28", "2026-03-08")
        for language in ("de", "fr", "it")
    ]


def test_an_address_that_no_longer_answers() -> None:
    address = made_up.explanation_address("2016-02-28", "it")

    def probe(asked: str) -> str | None:
        return "answers with status 404" if asked == address else None

    with pytest.raises(
        SourceError, match=rf"2016-02-28, Italian: {address} answers with status 404"
    ):
        check_explanations(read(made_up.summaries()), probe)
