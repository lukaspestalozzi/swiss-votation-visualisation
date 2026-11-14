from typing import Any

import made_up
import pytest

from pipeline.counts import SourceError
from pipeline.feed import Day, read_day

SOURCE = "feed_20160228.json"


def read(document: dict[str, Any], source: str = SOURCE) -> Day:
    return read_day(document, source)


def test_a_vote_is_read_with_its_id_date_kind_and_titles() -> None:
    day = read(made_up.feed_day("2016-02-28"))
    assert [vote.id for vote in day.votes] == [5960, 5990]
    vote = day.votes[0]
    assert vote.date == "2016-02-28"
    assert vote.kind == "popular-initiative"
    assert day.votes[1].kind == "optional-referendum"
    assert vote.title == {
        "de": "Vorlage 5960 (de)",
        "fr": "Vorlage 5960 (fr)",
        "it": "Vorlage 5960 (it)",
    }


def test_a_code_that_is_not_known_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["vorlagenArtId"] = 7
    with pytest.raises(SourceError, match=r"feed_20160228.json, vote 5960: .*code 7"):
        read(document)


def test_the_code_and_the_double_majority_contradict_each_other() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5990)["doppeltesMehr"] = True
    with pytest.raises(SourceError, match=r"vote 5990: .*code 2.*double majority"):
        read(document)


def test_a_missing_title_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    titles = made_up.vote_of(document, 5960)["vorlagenTitel"]
    titles[:] = [title for title in titles if title["langKey"] != "it"]
    with pytest.raises(SourceError, match=r"vote 5960: .*title in 'it'"):
        read(document)


def test_an_empty_title_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    for title in made_up.vote_of(document, 5960)["vorlagenTitel"]:
        if title["langKey"] == "it":
            title["text"] = ""
    with pytest.raises(SourceError, match=r"vote 5960: .*title in 'it'"):
        read(document)


def test_a_vote_without_a_complete_result_is_left_out_and_named() -> None:
    day = read(made_up.feed_day("2026-11-29"), "feed_20261129.json")
    assert day.votes == []
    assert [(vote.id, vote.date) for vote in day.left_out] == [(6900, "2026-11-29")]

    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 351)["resultat"]["gebietAusgezaehlt"] = False
    day = read(document)
    assert [vote.id for vote in day.votes] == [5990]
    assert [vote.id for vote in day.left_out] == [5960]


def test_the_reference_date_of_the_file_is_read() -> None:
    assert read(made_up.feed_day("2016-02-28")).reference_date == "2026-01-01"
    document = made_up.feed_day("2016-02-28")
    document["spatial_reference"][2]["spatial_date"] = "2027-01-01"
    assert read(document).reference_date == "2027-01-01"


def test_a_file_without_a_reference_date_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    document["spatial_reference"] = [unit for unit in document["spatial_reference"][:2]]
    with pytest.raises(SourceError, match=r"feed_20160228.json: .*reference date"):
        read(document)


def test_the_entries_are_read_with_canton_number_and_five_counts() -> None:
    vote = read(made_up.feed_day("2016-02-28")).votes[0]
    assert vote.entries.height == 6
    assert vote.entries.row(0, named=True) == {
        "canton": "ZH",
        "number": 1,
        "registered": 1398,
        "cast": 999,
        "valid": 982,
        "yes": 432,
        "no": 550,
    }
    # As the file lists it: Moutier under JU, whatever canton counted it on the day.
    moutier = vote.entries.filter(number=6831)
    assert moutier["canton"].to_list() == ["JU"]


def test_missing_yes_votes_in_an_entry_stop() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 1)["resultat"]["jaStimmenAbsolut"] = None
    with pytest.raises(SourceError) as error:
        read(document)
    assert "feed_20160228.json, vote 5960, entry 1: yes votes is None" in str(error.value)


def test_more_valid_ballots_than_ballots_cast_stop() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 1)["resultat"]["gueltigeStimmen"] = 1000
    with pytest.raises(SourceError, match=r"vote 5960, entry 1: .*1000 valid ballots.*999 ballots"):
        read(document)


def test_more_ballots_cast_than_registered_voters_stop() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 1)["resultat"]["anzahlStimmberechtigte"] = 998
    with pytest.raises(
        SourceError, match=r"vote 5960, entry 1: .*999 ballots cast.*998 registered"
    ):
        read(document)


def test_valid_ballots_other_than_yes_plus_no_stop_in_a_usual_vote() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.entry_of(document, 5960, 1)["resultat"]["neinStimmenAbsolut"] = 549
    with pytest.raises(
        SourceError, match=r"vote 5960, entry 1: .*982 valid ballots.*432 yes.*549 no"
    ):
        read(document)


def test_an_unanswered_question_is_accepted_where_a_voter_may_leave_it() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["vorlagenArtId"] = 4
    made_up.entry_of(document, 5960, 1)["resultat"]["neinStimmenAbsolut"] = 500
    vote = read(document).votes[0]
    assert vote.kind == "initiative-with-counter-proposal"
    assert vote.entries.row(0, named=True)["valid"] == 982


def test_fewer_valid_ballots_than_yes_plus_no_stop_in_every_kind() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["vorlagenArtId"] = 4
    made_up.entry_of(document, 5960, 1)["resultat"]["neinStimmenAbsolut"] = 551
    with pytest.raises(
        SourceError, match=r"vote 5960, entry 1: 982 valid ballots, 432 yes and 551"
    ):
        read(document)


@pytest.mark.parametrize("position", ["0", "27"])
def test_a_canton_that_is_not_one_of_the_26_stops(position: str) -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["kantone"][2]["geoLevelnummer"] = position
    with pytest.raises(SourceError, match=rf"vote 5960: the canton is {position}"):
        read(document)


def test_a_verdict_that_is_no_truth_value_stops() -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["vorlageAngenommen"] = None
    with pytest.raises(SourceError, match=r"vote 5960: .*vorlageAngenommen"):
        read(document)


@pytest.mark.parametrize("value", ["2", 2.0, None])
def test_cantonal_votes_that_are_not_whole_numbers_stop(value: object) -> None:
    document = made_up.feed_day("2016-02-28")
    made_up.vote_of(document, 5960)["staende"]["jaStaendeGanz"] = value
    with pytest.raises(SourceError, match=r"vote 5960: .*cantonal votes"):
        read(document)


def test_the_cantonal_votes_and_the_verdict_are_read() -> None:
    initiative, referendum = read(made_up.feed_day("2016-02-28")).votes
    assert initiative.cantonal_votes == (2, 1)
    assert initiative.passed is True
    # Until 2018 the file gives no cantonal votes for an optional referendum.
    assert referendum.cantonal_votes is None
