import pytest

from pipeline.counts import SourceError, count

WHERE = "feed_20160228.json, vote 5960, entry 1"


def test_a_whole_number_from_zero_is_returned_as_it_is() -> None:
    assert count(0, "yes votes", WHERE) == 0
    assert count(1398, "registered voters", WHERE) == 1398


def test_a_missing_value_is_refused_and_the_place_named() -> None:
    with pytest.raises(SourceError) as error:
        count(None, "yes votes", WHERE)
    for part in ("feed_20160228.json", "vote 5960", "entry 1", "yes votes"):
        assert part in str(error.value)


def test_a_fraction_is_refused() -> None:
    with pytest.raises(SourceError, match="no votes is 550.0"):
        count(550.0, "no votes", WHERE)


def test_a_number_given_as_text_is_refused() -> None:
    with pytest.raises(SourceError, match="registered voters is '1398'"):
        count("1398", "registered voters", WHERE)


def test_a_count_below_zero_is_refused() -> None:
    with pytest.raises(SourceError, match="ballots cast is -1"):
        count(-1, "ballots cast", WHERE)


def test_a_truth_value_is_refused() -> None:
    with pytest.raises(SourceError, match="yes votes is True"):
        count(True, "yes votes", WHERE)
