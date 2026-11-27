import gzip
from pathlib import Path

import pytest

from pipeline.counts import SourceError
from pipeline.stat_tab_cache import Cache, final_years

ANSWER = b'{"made": "up", "value": [1, 2, 3]}'


def test_the_same_query_is_served(tmp_path: Path) -> None:
    Cache(tmp_path).write("population_ages_2016_0.json", "query A", ANSWER)
    cache = Cache(tmp_path)
    assert cache.read("population_ages_2016_0.json", "query A") == ANSWER


def test_another_query_or_another_name_is_not(tmp_path: Path) -> None:
    Cache(tmp_path).write("population_ages_2016_0.json", "query A", ANSWER)
    cache = Cache(tmp_path)
    assert cache.read("population_ages_2016_0.json", "query B") is None
    assert cache.read("population_ages_2017_0.json", "query A") is None


def test_the_same_answer_gives_the_same_bytes(tmp_path: Path) -> None:
    first, second = tmp_path / "first", tmp_path / "second"
    Cache(first).write("election_2019.json", "q", ANSWER)
    Cache(second).write("election_2019.json", "q", ANSWER)
    for name in ("election_2019.json.gz", "index.json"):
        assert (first / name).read_bytes() == (second / name).read_bytes()


def test_a_file_without_its_entry_stops(tmp_path: Path) -> None:
    Cache(tmp_path).write("election_2019.json", "q", ANSWER)
    (tmp_path / "election_2015.json.gz").write_bytes(b"stray")
    with pytest.raises(SourceError, match=r"election_2015\.json\.gz: in the cache without"):
        Cache(tmp_path)


def test_an_entry_without_its_file_stops(tmp_path: Path) -> None:
    Cache(tmp_path).write("election_2019.json", "q", ANSWER)
    (tmp_path / "election_2019.json.gz").unlink()
    with pytest.raises(SourceError, match=r"election_2019\.json has no file"):
        Cache(tmp_path)


def test_a_file_changed_by_hand_stops(tmp_path: Path) -> None:
    Cache(tmp_path).write("election_2019.json", "q", ANSWER)
    (tmp_path / "election_2019.json.gz").write_bytes(gzip.compress(b"changed"))
    with pytest.raises(SourceError, match=r"not the answer index\.json names"):
        Cache(tmp_path).read("election_2019.json", "q")


def test_an_empty_or_missing_directory_is_an_empty_cache(tmp_path: Path) -> None:
    assert Cache(tmp_path / "none").read("x.json", "q") is None


def test_all_years_but_the_newest_are_final() -> None:
    # The population's totals ending in 2025, the elections ending in 2023.
    assert final_years(range(2012, 2026)) == set(range(2012, 2025))
    assert final_years([2011, 2015, 2019, 2023]) == {2011, 2015, 2019}
    assert final_years([]) == set()
