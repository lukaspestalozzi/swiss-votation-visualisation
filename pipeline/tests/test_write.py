import json
from pathlib import Path
from typing import Any

import made_up

from pipeline.chancellery import read_chancellery
from pipeline.checks import CantonChange, check_entries, counted_for
from pipeline.feed import CANTONS, read_day
from pipeline.register import read_register
from pipeline.write import Data, Source, VoteData, write_data

MOUTIER = CantonChange(6831, "BE", "2025-12-31")
SOURCES = [
    Source("https://example.org/b.json", b'{"b": 1}', "2016-02-28T18:00:00"),
    Source("https://example.org/a.csv", b"a,b\n", None),
]


def data() -> Data:
    """The made-up sources, read and checked as the update does."""
    municipalities = read_register(made_up.register(), "register")
    chancellery = read_chancellery(made_up.chancellery(), "chancellery")
    days = [read_day(made_up.feed_day(date), date) for date in ("2026-03-08", "2016-02-28")]
    votes: list[VoteData] = []
    swiss_abroad: dict[str, int] = {}
    for day in days:
        for vote in day.votes:
            entries = check_entries(vote, municipalities, day.source)
            swiss_abroad |= entries.swiss_abroad
            votes.append(
                VoteData(
                    vote,
                    chancellery.votes[vote.id],
                    counted_for(vote, [MOUTIER]),
                    entries.without_result,
                )
            )
    return Data("2026-01-01", votes, municipalities, swiss_abroad, SOURCES)


def written(tmp_path: Path, name: str) -> Any:
    write_data(tmp_path, data())
    return json.loads((tmp_path / name).read_text(encoding="utf-8"))


def test_the_list_of_votes(tmp_path: Path) -> None:
    listing = written(tmp_path, "votes.json")
    assert listing["referenceDate"] == "2026-01-01"
    assert [vote["id"] for vote in listing["votes"]] == [5960, 5990, 6850]
    initiative, referendum, not_validated = listing["votes"]
    assert initiative == {
        "id": 5960,
        "number": 596,
        "date": "2016-02-28",
        "kind": "popular-initiative",
        "title": {"de": "Vorlage 5960 (de)", "fr": "Vorlage 5960 (fr)", "it": "Vorlage 5960 (it)"},
        "validated": True,
        "result": {
            "yes": 40830,
            "no": 39314,
            "cantonalVotesInFavour": 2,
            "cantonalVotesAgainst": 1,
            "passed": True,
        },
        "reference": {"de": "BBl 2019 4599", "fr": "FF 2019 4421", "it": "FF 2019 3843"},
        "note": {
            "de": "Das Bundesgericht hat … aufgehoben.",
            "fr": "Le Tribunal fédéral …",
            "it": "Il Tribunale …",
        },
        "sums": {
            "registered": 136283,
            "cast": 81576,
            "validBallots": 80144,
            "yes": 40830,
            "no": 39314,
        },
    }
    # Validated, without cantonal votes and without a note: null, never a missing key.
    assert referendum["result"]["cantonalVotesInFavour"] is None
    assert referendum["result"]["cantonalVotesAgainst"] is None
    assert referendum["note"] is None
    # Not validated: the BFS's result, no reference, no note.
    assert not_validated["validated"] is False
    assert not_validated["result"]["yes"] == not_validated["sums"]["yes"]
    assert not_validated["result"]["cantonalVotesInFavour"] is not None
    assert (not_validated["reference"], not_validated["note"]) == (None, None)
    for vote in listing["votes"]:
        assert set(vote) == set(initiative)
        assert set(vote["result"]) == set(initiative["result"])


def test_a_vote_file(tmp_path: Path) -> None:
    vote = written(tmp_path, "votes/5960.json")
    assert vote["id"] == 5960
    assert list(vote["entries"]) == list(CANTONS)
    assert vote["entries"]["ZH"] == [
        [1, 1398, 999, 982, 432, 550],
        [2, 8000, 5000, 4900, 2000, 2900],
        [9010, 24121, 8699, 8535, 3596, 4939],
    ]
    # Moutier voted in BE in 2016: it is under BE, after Bern by its number.
    assert [row[0] for row in vote["entries"]["BE"]] == [351, 6831]
    assert [row[0] for row in vote["entries"]["JU"]] == [6711]
    assert vote["entries"]["LU"] == []
    assert vote["withoutResult"] == [389]
    later = json.loads((tmp_path / "votes/6850.json").read_text(encoding="utf-8"))
    assert [row[0] for row in later["entries"]["JU"]] == [6711, 6831]


def test_the_list_of_municipalities(tmp_path: Path) -> None:
    listing = written(tmp_path, "municipalities.json")
    assert listing["referenceDate"] == "2026-01-01"
    assert list(listing["municipalities"]) == list(CANTONS)
    assert listing["municipalities"]["BE"] == [[351, "Bern"], [389, "Meienried"]]
    assert listing["municipalities"]["JU"] == [[6711, "Delémont"], [6831, "Moutier"]]
    assert listing["swissAbroad"] == {"ZH": 9010}


def test_the_record_of_the_sources(tmp_path: Path) -> None:
    assert written(tmp_path, "sources.json") == {
        "sources": [
            {
                "address": "https://example.org/a.csv",
                "bytes": 4,
                "sha256": "5be08c9684a1d25efcee09318204824278b08bbfb4aef973ffefd0b9d7478313",
                "stated": None,
            },
            {
                "address": "https://example.org/b.json",
                "bytes": 8,
                "sha256": "cae1fd1cafc3a224720d8b52c3615332619526ae2526b2cd7afb72a7405ee526",
                "stated": "2016-02-28T18:00:00",
            },
        ]
    }


def test_writing_twice_gives_the_same_bytes(tmp_path: Path) -> None:
    first, second = tmp_path / "first", tmp_path / "second"
    for directory in (first, second):
        directory.mkdir()
        write_data(directory, data())
    files = sorted(path.relative_to(first) for path in first.rglob("*.json"))
    assert len(files) == 6
    assert files == sorted(path.relative_to(second) for path in second.rglob("*.json"))
    for name in files:
        assert (first / name).read_bytes() == (second / name).read_bytes()
