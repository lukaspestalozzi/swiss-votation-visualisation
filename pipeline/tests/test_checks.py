from typing import Any

import made_up
import polars as pl
import pytest

from pipeline.chancellery import Chancellery, read_chancellery
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
from pipeline.counts import SourceError
from pipeline.feed import Day, Vote, read_day
from pipeline.register import Municipality, read_register

SOURCE = "feed_20160228.json"


def municipalities() -> list[Municipality]:
    return read_register(made_up.register(), "register_2026-01-01.csv")


def vote(document: dict[str, Any], vote_id: int = 5960) -> Vote:
    day = read_day(document, SOURCE)
    return next(vote for vote in day.votes if vote.id == vote_id)


def add_entry(document: dict[str, Any], canton: int, number: int) -> None:
    """A copy of the first entry of a canton, under another number."""
    places = made_up.vote_of(document, 5960)["kantone"][canton]["gemeinden"]
    places.append(dict(places[0], geoLevelnummer=str(number)))


def test_an_entry_that_is_not_known_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    add_entry(document, 0, 7999)
    with pytest.raises(SourceError, match=r"feed_20160228.json, vote 5960: the entry 7999 "):
        check_entries(vote(document), municipalities(), SOURCE)


def test_a_municipality_twice_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    add_entry(document, 0, 1)
    with pytest.raises(SourceError, match=r"vote 5960: the entry 1 appears twice"):
        check_entries(vote(document), municipalities(), SOURCE)


def test_the_swiss_abroad_of_a_canton_are_an_entry_of_their_own() -> None:
    entries = check_entries(vote(made_up.feed_day("2016-02-28")), municipalities(), SOURCE)
    assert entries.swiss_abroad == {"ZH": 9010}


def test_the_swiss_abroad_of_another_canton_stop() -> None:
    document = made_up.feed_day("2016-02-28")
    zurich, bern = made_up.vote_of(document, 5960)["kantone"][:2]
    abroad = made_up.entry_of(document, 5960, 9010)
    zurich["gemeinden"].remove(abroad)
    bern["gemeinden"].append(abroad)
    with pytest.raises(
        SourceError, match=r"vote 5960: the entry 9010 is the Swiss abroad of ZH, .* BE"
    ):
        check_entries(vote(document), municipalities(), SOURCE)


def test_the_municipalities_without_a_result_are_named() -> None:
    entries = check_entries(vote(made_up.feed_day("2016-02-28")), municipalities(), SOURCE)
    assert entries.without_result == [389]


def test_vote_days_on_two_lists_of_municipalities_stop() -> None:
    documents = {"feed_20160228.json": made_up.feed_day("2016-02-28")}
    documents["feed_20260308.json"] = made_up.feed_day("2026-03-08")
    assert reference_date([read_day(d, name) for name, d in documents.items()]) == "2026-01-01"
    documents["feed_20260308.json"]["spatial_reference"][2]["spatial_date"] = "2027-01-01"
    days = [read_day(document, name) for name, document in documents.items()]
    with pytest.raises(SourceError) as error:
        reference_date(days)
    for part in ("feed_20260308.json: 2027-01-01", "feed_20160228.json: 2026-01-01"):
        assert part in str(error.value)


MOUTIER = CantonChange(municipality=6831, canton="BE", until="2025-12-31")


def canton_of(entries: pl.DataFrame, number: int) -> str:
    cantons = entries.filter(number=number)["canton"].to_list()
    assert len(cantons) == 1
    return str(cantons[0])


def test_an_entry_counts_for_the_canton_it_voted_in() -> None:
    before = vote(made_up.feed_day("2016-02-28"))
    after = read_day(made_up.feed_day("2026-03-08"), "feed_20260308.json").votes[0]
    assert canton_of(counted_for(before, [MOUTIER]), 6831) == "BE"
    assert canton_of(counted_for(after, [MOUTIER]), 6831) == "JU"
    # The last day in the earlier canton counts for it; the day after does not.
    assert canton_of(counted_for(before, [CantonChange(6831, "BE", "2016-02-28")]), 6831) == "BE"
    assert canton_of(counted_for(before, [CantonChange(6831, "BE", "2016-02-27")]), 6831) == "JU"
    # Every other entry stays where the file lists it.
    assert counted_for(before, [MOUTIER]).drop("canton").equals(before.entries.drop("canton"))


def test_entries_that_do_not_sum_to_the_canton_stop() -> None:
    before = vote(made_up.feed_day("2016-02-28"))
    check_canton_sums(before, counted_for(before, [MOUTIER]), SOURCE)
    with pytest.raises(SourceError) as error:
        check_canton_sums(before, counted_for(before, []), SOURCE)
    message = str(error.value)
    assert message.startswith("feed_20160228.json, vote 5960: the entries of BE sum to 90000")
    for part in ("registered voters", "94764"):
        assert part in message


def test_entries_that_do_not_sum_to_the_national_figure_stop() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["resultat"]["jaStimmenAbsolut"] -= 1
    broken = vote(document)
    with pytest.raises(SourceError) as error:
        check_national_sums(broken, broken.entries, SOURCE)
    assert str(error.value) == (
        "feed_20160228.json, vote 5960: the entries sum to 40830 yes votes, "
        "the file gives 40829 for Switzerland"
    )
    check_national_sums(vote(made_up.feed_day("2016-02-28")), broken.entries, SOURCE)


def days(*documents: dict[str, Any]) -> list[Day]:
    if not documents:
        documents = (made_up.feed_day("2016-02-28"), made_up.feed_day("2026-03-08"))
    return [read_day(document, f"feed_{document['abstimmtag']}.json") for document in documents]


def official(document: dict[str, Any] | None = None) -> Chancellery:
    return read_chancellery(document or made_up.chancellery(), "chancellery.json")


def compare(
    feed: list[Day], chancellery: Chancellery, known: list[KnownDifference] | None = None
) -> None:
    check_official([vote for day in feed for vote in day.votes], chancellery, known or [])


def test_validated_votes_whose_sums_equal_the_official_result_pass() -> None:
    compare(days(), official())


def chancellery_with_200_fewer_no_votes() -> Chancellery:
    document = made_up.chancellery()
    made_up.official_of(document, 5960)["no"]["value"] = "39114"
    return official(document)


def test_a_difference_that_is_not_listed_stops() -> None:
    with pytest.raises(SourceError) as error:
        compare(days(), chancellery_with_200_fewer_no_votes())
    assert str(error.value) == (
        "vote 5960: the entries sum to 39314 no votes, the Federal Chancellery gives 39114"
    )


def test_a_listed_difference_passes() -> None:
    known = [KnownDifference(vote=5960, count="no", entries=39314, official=39114)]
    compare(days(), chancellery_with_200_fewer_no_votes(), known)


def test_a_listed_difference_that_does_not_occur_stops() -> None:
    known = [KnownDifference(vote=5960, count="no", entries=39314, official=39114)]
    with pytest.raises(SourceError) as error:
        compare(days(), official(), known)
    assert str(error.value) == (
        "the list of known differences has a line the sources do not show: vote 5960, "
        "no votes, 39314 in the entries, 39114 officially"
    )


def test_two_verdicts_that_differ_stop() -> None:
    document = made_up.chancellery()
    made_up.official_of(document, 5960)["result"]["value"] = made_up.ERGEBNIS + "2"
    with pytest.raises(SourceError) as error:
        compare(days(), official(document))
    assert str(error.value) == (
        "vote 5960: the Federal Chancellery gives it as rejected, the BFS file as accepted"
    )


def test_cantonal_votes_that_differ_stop() -> None:
    document = made_up.chancellery()
    made_up.official_of(document, 5960)["cy"]["value"] = "1.5"
    made_up.official_of(document, 5960)["cn"]["value"] = "1.5"
    with pytest.raises(SourceError) as error:
        compare(days(), official(document))
    assert str(error.value) == (
        "vote 5960: the Federal Chancellery gives the cantonal votes as 1.5 to 1.5, "
        "the BFS file as 2.0 to 1.0"
    )


def test_a_validated_vote_without_a_complete_result_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 351)["resultat"]["gebietAusgezaehlt"] = False
    with pytest.raises(SourceError) as error:
        compare(days(document, made_up.feed_day("2026-03-08")), official())
    assert str(error.value) == (
        "vote 5960: the Federal Chancellery has validated it, and the BFS file has no complete "
        "result for it"
    )


def test_a_vote_without_a_row_of_the_chancellery_stops() -> None:
    document = made_up.chancellery()
    document["results"]["bindings"].remove(made_up.official_of(document, 5990))
    with pytest.raises(SourceError) as error:
        compare(days(), official(document))
    assert str(error.value) == (
        "vote 5990 of 2016-02-28: the Federal Chancellery has no row for it"
    )


def test_a_validated_vote_without_a_verdict_stops_unless_it_is_a_tie_break_question() -> None:
    document = made_up.chancellery()
    made_up.official_of(document, 5960)["result"]["value"] = made_up.ERGEBNIS + "4"
    with pytest.raises(SourceError) as error:
        compare(days(), official(document))
    assert str(error.value) == (
        "vote 5960: the Federal Chancellery gives it as neither accepted nor rejected, "
        "the BFS file as accepted"
    )
    tie_break = made_up.feed_day("2016-02-28")
    made_up.vote_of(tie_break, 5960)["vorlagenArtId"] = 6
    compare(days(tie_break, made_up.feed_day("2026-03-08")), official(document))
