"""Made-up source documents in the shape of the real ones, for the tests.

Three cantons (ZH, BE, JU), a handful of municipalities, three votes on two vote days, and one
vote day still to come. The canton figures, the national figures and the cantonal votes are
computed from the entries, so they always add up; a test breaks its own copy. Each function
returns a new document.

As in the real files, Moutier (6831) is listed under JU for every vote, and the canton figures
count it for BE in the votes before 2026. Meienried (389) is on the register and has no entry.
"""

from typing import Any

# The canton's position in the Federal Constitution, art. 1, as the BFS files number it.
POSITIONS = {"ZH": 1, "BE": 2, "JU": 26}
# number: (name, the canton of the register and of the feed's lists)
MUNICIPALITIES = {
    1: ("Aeugst am Albis", "ZH"),
    2: ("Affoltern am Albis", "ZH"),
    351: ("Bern", "BE"),
    389: ("Meienried", "BE"),
    6711: ("Delémont", "JU"),
    6831: ("Moutier", "JU"),
}
SWISS_ABROAD = {9010: ("ZH-Ausland-CH", "ZH")}
MOUTIER, BERN_UNTIL = 6831, "2025-12-31"

# Per vote: id, date, BFS kind code, and per entry [registered, cast, valid, yes, no].
VOTES: dict[int, dict[str, Any]] = {
    5960: {
        "date": "2016-02-28",
        "kind": 3,
        "number": 596,
        "entries": {
            1: [1398, 999, 982, 432, 550],
            2: [8000, 5000, 4900, 2000, 2900],
            9010: [24121, 8699, 8535, 3596, 4939],
            351: [90000, 60000, 59000, 31000, 28000],
            6711: [8000, 5000, 4900, 2600, 2300],
            6831: [4764, 1878, 1827, 1202, 625],
        },
    },
    5990: {
        "date": "2016-02-28",
        "kind": 2,
        "number": 599,
        "entries": {
            1: [1398, 990, 970, 500, 470],
            2: [8000, 4900, 4800, 2500, 2300],
            9010: [24121, 8600, 8500, 4000, 4500],
            351: [90000, 59000, 58000, 30000, 28000],
            6711: [8000, 4900, 4800, 2200, 2600],
            6831: [4764, 1800, 1780, 1000, 780],
        },
    },
    6850: {
        "date": "2026-03-08",
        "kind": 2,
        "number": 685,
        "entries": {
            1: [1450, 1000, 990, 560, 430],
            2: [8200, 5100, 5000, 2700, 2300],
            9010: [26000, 9000, 8900, 4400, 4500],
            351: [91000, 61000, 60000, 33000, 27000],
            6711: [8100, 5000, 4950, 2400, 2550],
            6831: [4800, 1900, 1850, 1100, 750],
        },
    },
}
SCHEDULED: dict[str, Any] = {"date": "2026-11-29", "id": 6900, "kind": 1}
COUNTS = (
    "anzahlStimmberechtigte",
    "eingelegteStimmzettel",
    "gueltigeStimmen",
    "jaStimmenAbsolut",
    "neinStimmenAbsolut",
)


def _result(figures: list[int]) -> dict[str, Any]:
    result: dict[str, Any] = {"gebietAusgezaehlt": True}
    result.update(zip(COUNTS, figures, strict=True))
    result["jaStimmenInProzent"] = 100 * figures[3] / (figures[3] + figures[4])
    result["stimmbeteiligungInProzent"] = 100 * figures[1] / figures[0]
    return result


def _place(number: int, figures: list[int]) -> dict[str, Any]:
    name = (MUNICIPALITIES | SWISS_ABROAD)[number][0]
    return {
        "geoLevelnummer": str(number),
        "geoLevelname": name,
        "geoLevelParentnummer": "0",
        "resultat": _result(figures),
    }


def _voting_canton(number: int, date: str) -> str:
    """The canton whose figures an entry is part of: Moutier was in BE until 2025."""
    if number == MOUTIER and date <= BERN_UNTIL:
        return "BE"
    return (MUNICIPALITIES | SWISS_ABROAD)[number][1]


def feed_vote(vote_id: int) -> dict[str, Any]:
    """One vote of a BFS vote-day file, with a complete result."""
    spec = VOTES[vote_id]
    kind, date, entries = spec["kind"], spec["date"], spec["entries"]
    totals = {canton: [0] * 5 for canton in POSITIONS}
    for number, figures in entries.items():
        canton = _voting_canton(number, date)
        totals[canton] = [a + b for a, b in zip(totals[canton], figures, strict=True)]
    national = [sum(column) for column in zip(*totals.values(), strict=True)]
    in_favour = [c for c, t in totals.items() if t[3] > t[4]]
    against = [c for c, t in totals.items() if t[3] <= t[4]]
    double = kind != 2
    cantonal_votes_given = kind != 2 or date >= "2018-06-10"
    staende_keys = ("jaStaendeGanz", "neinStaendeGanz", "jaStaendeHalb", "neinStaendeHalb")
    staende_values = (len(in_favour), len(against), 0, 0)
    passed = national[3] > national[4] and (not double or len(in_favour) > len(against))
    return {
        "vorlagenId": vote_id,
        "reihenfolgeAnzeige": vote_id,
        "vorlagenTitel": [
            {"langKey": language, "text": f"Vorlage {vote_id} ({language})"}
            for language in ("de", "fr", "it", "rm", "en")
        ],
        "vorlageBeendet": True,
        "provisorisch": date >= "2026-01-01",
        "vorlageAngenommen": passed,
        "vorlagenArtId": kind,
        "hauptvorlagenId": None,
        "reserveInfoText": None,
        "doppeltesMehr": double,
        "staende": {
            key: value if cantonal_votes_given else None
            for key, value in zip(staende_keys, staende_values, strict=True)
        }
        | {"anzahlStaendeGanz": 3, "anzahlStaendeHalb": 0},
        "resultat": _result(national),
        "kantone": [
            {
                "geoLevelnummer": str(position),
                "geoLevelname": canton,
                "resultat": _result(totals[canton]) | {"vorlageBeendet": True},
                "bezirke": [],
                "gemeinden": [
                    _place(number, figures)
                    for number, figures in entries.items()
                    if (MUNICIPALITIES | SWISS_ABROAD)[number][1] == canton
                ],
                "zaehlkreise": [],
            }
            for canton, position in POSITIONS.items()
        ],
    }


def scheduled_vote() -> dict[str, Any]:
    """A vote that is announced and not yet counted: every figure is missing."""
    empty = dict.fromkeys(COUNTS) | {
        "gebietAusgezaehlt": False,
        "jaStimmenInProzent": None,
        "stimmbeteiligungInProzent": None,
    }
    return {
        "vorlagenId": SCHEDULED["id"],
        "reihenfolgeAnzeige": SCHEDULED["id"],
        "vorlagenTitel": [
            {"langKey": language, "text": f"Vorlage {SCHEDULED['id']} ({language})"}
            for language in ("de", "fr", "it", "rm", "en")
        ],
        "vorlageBeendet": False,
        "provisorisch": True,
        "vorlageAngenommen": None,
        "vorlagenArtId": SCHEDULED["kind"],
        "hauptvorlagenId": None,
        "reserveInfoText": None,
        "doppeltesMehr": True,
        "staende": dict.fromkeys(
            ("jaStaendeGanz", "neinStaendeGanz", "anzahlStaendeGanz")
            + ("jaStaendeHalb", "neinStaendeHalb", "anzahlStaendeHalb")
        ),
        "resultat": dict(empty),
        "kantone": [
            {
                "geoLevelnummer": str(position),
                "geoLevelname": canton,
                "resultat": dict(empty) | {"vorlageBeendet": False},
                "bezirke": [],
                "gemeinden": [
                    {
                        "geoLevelnummer": str(number),
                        "geoLevelname": name,
                        "geoLevelParentnummer": "0",
                        "resultat": dict(empty),
                    }
                    for number, (name, home) in (MUNICIPALITIES | SWISS_ABROAD).items()
                    if home == canton and number != 389
                ],
                "zaehlkreise": [],
            }
            for canton, position in POSITIONS.items()
        ],
    }


def feed_day(date: str) -> dict[str, Any]:
    """The BFS file of one vote day: its votes in the order of their ids."""
    if date == SCHEDULED["date"]:
        votes = [scheduled_vote()]
    else:
        votes = [feed_vote(i) for i, spec in sorted(VOTES.items()) if spec["date"] == date]
    return {
        "abstimmtag": date.replace("-", ""),
        "timestamp": f"{date}T18:00:00",
        "spatial_reference": [
            {"spatial_unit": "kant", "spatial_date": "1979-01-01"},
            {"spatial_unit": "bezk", "spatial_date": "2026-01-01"},
            {"spatial_unit": "voge", "spatial_date": "2026-01-01"},
        ],
        "schweiz": {
            "geoLevelnummer": 0,
            "geoLevelname": "Schweiz",
            "nochKeineInformation": False,
            "vorlagen": votes,
        },
    }


def vote_of(day: dict[str, Any], vote_id: int) -> dict[str, Any]:
    """The vote with this id in a vote-day document, to break it in a test."""
    votes: list[dict[str, Any]] = day["schweiz"]["vorlagen"]
    return next(vote for vote in votes if vote["vorlagenId"] == vote_id)


def entry_of(day: dict[str, Any], vote_id: int, number: int) -> dict[str, Any]:
    """The entry with this number of a vote in a vote-day document."""
    cantons: list[dict[str, Any]] = vote_of(day, vote_id)["kantone"]
    places = [place for canton in cantons for place in canton["gemeinden"]]
    return next(place for place in places if place["geoLevelnummer"] == str(number))


ERGEBNIS = "https://politics.ld.admin.ch/political-rights/popular-vote/ergebnis/"
QUERY_VARIABLES = [
    "date", "number", "id", "result", "yes", "no", "cy", "cn",
    "srcde", "srcfr", "srcit", "notede", "notefr", "noteit",
]  # fmt: skip
# Validated: the reference in the Federal Gazette, in German, French and Italian.
REFERENCES = {
    5960: ("BBl 2019 4599", "FF 2019 4421", "FF 2019 3843"),
    5990: ("BBl 2016 3901", "FF 2016 3729", "FF 2016 3419"),
    6850: ("BBl 2026 1999", "FF 2026 1999", "FF 2026 1999"),
}
VALIDATED = (5960, 5990)
NOTES = {5960: ("Das Bundesgericht hat … aufgehoben.", "Le Tribunal fédéral …", "Il Tribunale …")}
FUTURE: dict[str, Any] = {"date": "2027-02-28", "id": 6940}


def _literal(value: str) -> dict[str, str]:
    return {"type": "literal", "value": value}


def _official_row(vote_id: int, validated: tuple[int, ...]) -> dict[str, dict[str, str]]:
    if vote_id in validated:
        vote = feed_vote(vote_id)
        result, staende = vote["resultat"], vote["staende"]
        given = staende["jaStaendeGanz"] is not None and vote["doppeltesMehr"]
        values = {
            "date": VOTES[vote_id]["date"],
            "number": str(VOTES[vote_id]["number"]),
            "result": ERGEBNIS + ("1" if vote["vorlageAngenommen"] else "2"),
            "yes": str(result["jaStimmenAbsolut"]),
            "no": str(result["neinStimmenAbsolut"]),
            "cy": str(float(staende["jaStaendeGanz"] + staende["jaStaendeHalb"] / 2))
            if given
            else "",
            "cn": str(float(staende["neinStaendeGanz"] + staende["neinStaendeHalb"] / 2))
            if given
            else "",
        }
        values |= dict(zip(("srcde", "srcfr", "srcit"), REFERENCES[vote_id], strict=True))
        if vote_id in NOTES:
            values |= dict(zip(("notede", "notefr", "noteit"), NOTES[vote_id], strict=True))
    else:
        # Not validated yet: the Chancellery writes "" for every figure.
        date = {
            6850: "2026-03-08",
            SCHEDULED["id"]: SCHEDULED["date"],
            FUTURE["id"]: FUTURE["date"],
        }
        values = dict.fromkeys(("yes", "no", "cy", "cn"), "") | {
            "date": date[vote_id],
            "number": str(vote_id // 10),
            "result": ERGEBNIS + "4",
        }
    return {"id": _literal(str(vote_id))} | {key: _literal(value) for key, value in values.items()}


def chancellery(validated: tuple[int, ...] = VALIDATED) -> dict[str, Any]:
    """The answer of the Federal Chancellery's SPARQL endpoint to the pipeline's query.

    The votes in `validated` have the Chancellery's figures; the others have none yet.
    """
    ids = [5960, 5990, 6850, SCHEDULED["id"], FUTURE["id"]]
    return {
        "head": {"vars": QUERY_VARIABLES},
        "results": {"bindings": [_official_row(vote_id, validated) for vote_id in ids]},
    }


def official_of(document: dict[str, Any], vote_id: int) -> dict[str, dict[str, str]]:
    """The row of a vote in the Chancellery's answer, to break it in a test."""
    rows: list[dict[str, dict[str, str]]] = document["results"]["bindings"]
    return next(row for row in rows if row["id"]["value"] == str(vote_id))


REGISTER_HEADER = (
    "HistoricalCode,BfsCode,ValidFrom,ValidTo,Level,Parent,Name,ShortName,"
    "Inscription,Radiation,Rec_Type_fr,Rec_Type_de"
)
# canton: (its HistoricalCode, its name, the HistoricalCode of its one district here)
REGISTER_CANTONS = {
    "ZH": ("1", "Zürich", "10053"),
    "BE": ("2", "Bern / Berne", "10241"),
    "JU": ("26", "Jura", "10321"),
}


def register() -> str:
    """The BFS register's snapshot of 2026-01-01, as CSV text: the made-up municipalities."""
    lines = [REGISTER_HEADER]
    for abbreviation, (code, name, district) in REGISTER_CANTONS.items():
        position = POSITIONS[abbreviation]
        lines.append(f"{code},{position},12.09.1848,,1,,{name},{abbreviation},,,,")
        lines.append(f"{district},{position}01,01.01.2010,,2,{code},Bezirk {name},{name},,,,")
    for number, (name, canton) in MUNICIPALITIES.items():
        district = REGISTER_CANTONS[canton][2]
        lines.append(f"{12000 + number},{number},01.01.1960,,3,{district},{name},{name},,,,")
    return "\n".join(lines) + "\n"
