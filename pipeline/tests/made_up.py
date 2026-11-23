"""Made-up source documents in the shape of the real ones, for the tests.

Three cantons (ZH, BE, JU), a handful of municipalities, three votes on two vote days, and one
vote day still to come. The canton figures, the national figures and the cantonal votes are
computed from the entries, so they always add up; a test breaks its own copy. Each function
returns a new document.

As in the real files, Moutier (6831) is listed under JU for every vote, and the canton figures
count it for BE in the votes before 2026. Meienried (389) is on the register and has no entry.

The map's sources are ZIPs of shapefiles in the shape of the real ones
(`investigations/map-data.md`): the register's boundaries of the municipalities, of all 26
cantons and of the country (one outer ring and one hole, a lake), and a ThemaKart set with its
two layers of lakes, one lake each. The first lake reaches past the country, the second fills
the hole. The first municipality's corners have fractions of a metre.
"""

import io
import itertools
import zipfile
from collections.abc import Callable
from typing import Any, Literal

import shapefile

from pipeline.feed import CANTONS

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


# A ring as `[x, y]` corners in LV95, closed. Shapefiles run outer rings clockwise and holes
# counter-clockwise.
Ring = list[list[float]]


def _square(x: float, y: float, size: float) -> Ring:
    """A clockwise square with its lower left corner at (x, y)."""
    return [[x, y], [x, y + size], [x + size, y + size], [x + size, y], [x, y]]


def _hole(x: float, y: float, size: float) -> Ring:
    return list(reversed(_square(x, y, size)))


# The country: x from 2,490,000 to 2,770,000, y from 1,090,000 to 1,210,000, with a hole.
COUNTRY = _square(2_490_000, 1_090_000, 120_000)[:2] + [
    [2_770_000, 1_210_000],
    [2_770_000, 1_090_000],
    [2_490_000, 1_090_000],
]
COUNTRY_HOLE = _hole(2_700_000, 1_150_000, 5_000)
# The lakes: (layer, id, name, ring). The first reaches past the country's eastern edge.
LAKES = [
    ("k4seenyyyymmdd11_ch2007Poly", 9001, "Grenzsee", _square(2_765_000, 1_160_000, 10_000)),
    ("k4seenyyyymmdd22_ch2007Poly", 9002, "Lochsee", _square(2_700_000, 1_150_000, 5_000)),
]


def municipality_ring(number: int) -> Ring:
    """A square of 1 km per made-up municipality, in a row; the first with fractions."""
    i = list(MUNICIPALITIES).index(number)
    if i == 0:
        return [[2_600_000.4, 1_200_000.6], [2_600_000.4, 1_201_000.4], [2_601_000.6, 1_201_000.4],
                [2_601_000.6, 1_200_000.6], [2_600_000.4, 1_200_000.6]]  # fmt: skip
    return _square(2_600_000 + 1_000 * i, 1_200_000, 1_000)


def canton_ring(abbreviation: str) -> Ring:
    """A square of 10 km per canton, in a row, in the order of the constitution."""
    return _square(2_500_000 + 10_000 * CANTONS.index(abbreviation), 1_100_000, 10_000)


Field = tuple[str, Literal["C", "N"]]


def _shapefile(
    stem: str, fields: list[Field], shapes: list[tuple[list[Any], list[Ring]]]
) -> dict[str, bytes]:
    """The files of one layer: `fields` as (name, type "N" or "C"), each shape its record
    and rings."""
    shp, shx, dbf = io.BytesIO(), io.BytesIO(), io.BytesIO()
    writer = shapefile.Writer(shp=shp, shx=shx, dbf=dbf, shapeType=shapefile.POLYGON)
    for name, kind in fields:
        # pyshp 3.1.6 wraps Writer.field in functools.wraps(DbfWriter.field), which mypy reads
        # as an unbound function that wants a Writer first; the call is right at run time.
        writer.field(name, kind, 10 if kind == "N" else 254)  # type: ignore[arg-type]
    for record, rings in shapes:
        writer.poly([[(x, y) for x, y in ring] for ring in rings])
        writer.record(*record)
    writer.close()
    return {
        f"{stem}.shp": shp.getvalue(),
        f"{stem}.shx": shx.getvalue(),
        f"{stem}.dbf": dbf.getvalue(),
        f"{stem}.cpg": b"UTF-8",
        f"{stem}.prj": b'PROJCS["CH1903+ / LV95"]',
    }


def _zip(files: dict[str, bytes]) -> bytes:
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w") as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return content.getvalue()


def boundaries_shapes(division: str) -> list[tuple[list[Any], list[Ring]]]:
    """The records and rings the register gives for a division; a test changes its copy."""
    if division == "Commune":
        return [
            ([name, 10000 + number, number, "", POSITIONS[canton], canton], [municipality_ring(number)])
            for number, (name, canton) in MUNICIPALITIES.items()
        ]  # fmt: skip
    if division == "Canton":
        return [([a, i + 1, a], [canton_ring(a)]) for i, a in enumerate(CANTONS)]
    return [(["Switzerland", "CH"], [COUNTRY, COUNTRY_HOLE])]


BOUNDARY_FIELDS: dict[str, list[Field]] = {
    "Commune": [("GDENAME", "C"), ("GDEHISTID", "N"), ("GDENR", "N"), ("KTNAME", "C"),
                ("KTNR", "N"), ("KTKZ", "C")],
    "Canton": [("KTNAME", "C"), ("KTNR", "N"), ("KTKZ", "C")],
    "Country": [("LNAME", "C"), ("LKZ", "C")],
}  # fmt: skip


def boundaries(
    division: str,
    date: str = "2026-01-01",
    shapes: list[tuple[list[Any], list[Ring]]] | None = None,
) -> bytes:
    """The register's ZIP of the K4 boundaries of `division` on `date`."""
    stem = f"Boundaries_K4_{division}_{date.replace('-', '')}"
    given = boundaries_shapes(division) if shapes is None else shapes
    return _zip(_shapefile(stem, BOUNDARY_FIELDS[division], given))


def themakart(lakes: bool = True, empty: bool = False) -> bytes:
    """The ThemaKart set's ZIP, with its two layers of lakes, or without them; `empty` keeps
    the layers without a lake."""
    files: dict[str, bytes] = {"2026_GEOM_TK/DOKU/README.txt": b"made up"}
    if lakes:
        for layer, number, name, ring in LAKES:
            shapes: list[tuple[list[Any], list[Ring]]] = [] if empty else [([number, name], [ring])]
            layer_files = _shapefile(layer, [("id", "N"), ("name", "C")], shapes)
            for file_name, data in layer_files.items():
                files[f"2026_GEOM_TK/00_TOPO/K4_seenyyyymmdd/{file_name}"] = data
    return _zip(files)


# The characteristics' sources (investigations/characteristics.md). STAT-TAB answers in json-stat2,
# each table on the list of an earlier date: since then Bonstetten (3) merged into Affoltern am
# Albis (2), and Moutier (700, BE) became 6831 (JU). The census of 2000 also has Wettswil (4),
# whose land is now part of Aeugst am Albis (1) and of Affoltern am Albis (2). Meienried (389) has
# no election result of its own. Every sum of a table is computed from its municipalities.
EARLIER: dict[int, tuple[str, str]] = {
    1: ("Aeugst am Albis", "ZH"),
    2: ("Affoltern am Albis", "ZH"),
    3: ("Bonstetten", "ZH"),
    351: ("Bern", "BE"),
    389: ("Meienried", "BE"),
    700: ("Moutier", "BE"),
    6711: ("Delémont", "JU"),
}
CENSUS_EARLIER = EARLIER | {4: ("Wettswil", "ZH")}
# A number of an earlier list: the numbers of the list of 2026-01-01 it is part of.
SUCCESSORS: dict[int, list[int]] = {2: [2], 3: [2], 700: [6831]}
CENSUS_SUCCESSORS = SUCCESSORS | {4: [1, 2]}
# The dates of the tables' lists, as the pipeline expects them.
LIST_DATES = {"population": "2025-04-06", "elections": "2023-01-01", "census": "2000-12-05",
              "jobs": "2024-01-01"}  # fmt: skip
DISTRICTS = {"ZH": ("000101", "Bezirk Affoltern"), "BE": ("000243", "Verwaltungskreis Seeland"),
             "JU": ("002601", "District de Delémont")}  # fmt: skip
CANTON_NAMES = {"ZH": "Zürich", "BE": "Bern / Berne", "JU": "Jura"}
POPULATION_YEARS = list(range(2010, 2026))
FARM_YEARS = list(range(2025, 2009, -1))  # newest first, as the real table lists them
ELECTION_YEARS = [2023, 2019, 2015, 2011]
# The single year of age that holds each age group's made-up inhabitants.
AGE_AT = [10, 25, 40, 55, 80]
# The real table's parties, by code, in its order.
PARTIES = {"1": "FDP", "34": "Mitte", "3": "SP", "4": "SVP", "5": "LPS", "7": "EVP", "8": "CSP",
           "31": "GLP", "9": "PdA", "27": "Sol.", "12": "FGA", "13": "Grüne", "15": "SD",
           "16": "EDU", "18": "Lega", "33": "MCR", "2": "CVP", "32": "BDP", "6": "LdU",
           "11": "POCH", "14": "Rep.", "10": "PSA", "17": "FPS", "26": "Sep.", "35": "Übrige"}  # fmt: skip
BASES = {1: 1_000, 2: 8_000, 3: 2_000, 4: 600, 351: 130_000, 389: 50, 700: 7_600, 6711: 12_000}
# swisstopo's area of each municipality of 2026-01-01 and its part in a lake, in ha.
AREAS: dict[int, tuple[int, int]] = {
    1: (790, 0), 2: (1062, 0), 351: (5162, 0), 389: (65, 0), 6711: (2203, 0), 6831: (1961, 0),
}  # fmt: skip


def population_groups(number: int, year: int) -> list[int]:
    """The inhabitants aged 0–17, 18–34, 35–49, 50–64, and 65 and over, at the end of a year."""
    base = BASES[number] + (year - 2010) * BASES[number] // 100
    return [base // 5, base // 4, base // 5, base // 5, base - base // 5 * 3 - base // 4]


def foreigners(number: int, year: int) -> int:
    return sum(population_groups(number, year)) // 4


def born_abroad(number: int, year: int) -> int:
    return sum(population_groups(number, year)) // 5


def cattle(number: int, year: int) -> int:
    return 0 if number == 351 else BASES[number] // 10 + year - 2010


def farms_of(number: int, year: int) -> list[int]:
    """The farms of a year, their farmland and the farmland of the organic ones, in hectares.
    Bern (351) has no farm and no farmland."""
    farms = 0 if number == 351 else BASES[number] // 100 + 1
    farmland = farms * (20 + year - 2010)
    return [farms, farmland, farmland // 4]


def party_votes(number: int, year: int) -> dict[str, int]:
    """A municipality's votes by party code; a party not named had no list there."""
    if number == 389:
        return {}
    base = BASES[number] * (7 if number == 351 else 1)
    votes = {"1": base // 7, "3": base // 4, "4": base // 4, "31": base // 20, "13": base // 10,
             "7": base // 50}  # fmt: skip
    return votes | ({"34": base // 8} if year >= 2021 else {"2": base // 10, "32": base // 40})


def languages(number: int) -> list[int]:
    """The census of 2000: all inhabitants, and those with German, French, Italian, Romansh."""
    base = BASES[number] * 9 // 10
    if EARLIER.get(number, ("", "ZH"))[1] == "JU" or number == 700:
        return [base, base // 20, base * 8 // 10, base // 25, 0]
    return [base, base * 8 // 10, base // 30, base // 25, base // 200]


# The real religion table's religions, by code, in its order.
RELIGIONS = {"0": "Religionen - Total", "1": "Evangelisch-reformierte Kirche",
             "2": "Evangelisch-methodistische Kirche", "3": "Neupietistisch-evangelikale Gemeinden",
             "4": "Pfingstgemeinden", "5": "Neuapostolische Kirchen", "6": "Zeugen Jehovas",
             "7": "Übrige protestantische Kirchen und Gemeinschaften",
             "8": "Römisch-katholische Kirche", "9": "Christkatholische Kirche",
             "10": "Christlich-orthodoxe Kirchen", "11": "Andere christliche Gemeinschaften",
             "12": "Jüdische Glaubensgemeinschaft", "13": "Islamische Gemeinschaften",
             "14": "Buddhistische Vereinigungen", "15": "Hinduistische Vereinigungen",
             "16": "Übrige Kirchen und Religionsgemeinschaften", "17": "Keine Zugehörigkeit",
             "18": "Ohne Angabe"}  # fmt: skip


def religions(number: int) -> dict[str, int]:
    """The census of 2000: the inhabitants by the code of their religion, those without an
    answer ("18") being the rest. A religion not named has none there."""
    base = languages(number)[0]
    named = {"1": base * 4 // 10, "8": base * 3 // 10, "13": base // 20, "17": base // 10}
    return named | {"18": base - sum(named.values())}


# The real education table's levels, by code, in its order.
EDUCATION_LEVELS = {"0": "Höchste abgeschlossene Ausbildung - Total",
                    "1": "Keine Ausbildung abgeschlossen", "2": "Obligatorische Schule",
                    "3": "Diplommittelschule oder berufsvorbereitende Schule",
                    "4": "Berufslehre, Vollzeit-Berufsschule", "5": "Maturitätsschule",
                    "6": "Lehrerseminar", "7": "Höhere Fach- und Berufsausbildung",
                    "8": "Höhere Fachschule", "9": "Fachhochschule",
                    "10": "Universität, Hochschule", "11": "Ohne Angabe", "12": "Schulpflichtig",
                    "13": "Noch nicht schulpflichtig"}  # fmt: skip


def education_levels(number: int) -> dict[str, int]:
    """The census of 2000: the inhabitants by the code of their highest completed education,
    those not yet of school age ("13") being the rest."""
    base = languages(number)[0]
    parts = {"1": 50, "2": 5, "3": 40, "4": 4, "5": 30, "6": 100, "7": 20, "8": 60, "9": 80,
             "10": 15, "11": 12, "12": 9}  # fmt: skip
    levels = {code: base // part for code, part in parts.items()}
    return levels | {"13": base - sum(levels.values())}


Dimension = tuple[str, list[tuple[str, str]]]


def json_stat(
    label: str,
    dimensions: list[Dimension],
    cell: Callable[[tuple[str, ...]], int | None],
    sign: str = "...",
) -> dict[str, Any]:
    """A STAT-TAB answer in json-stat2: `cell` gives the value of each combination of codes,
    None for one the table writes `sign`."""
    values: list[int | None] = []
    status: dict[str, str] = {}
    for i, key in enumerate(itertools.product(*[[c for c, _ in codes] for _, codes in dimensions])):
        value = cell(key)
        values.append(value)
        if value is None:
            status[str(i)] = sign
    return {
        "class": "dataset",
        "label": label,
        "source": "BFS - made up - © BFS",
        "updated": "2026-01-01T00:00:00Z",
        "id": [name for name, _ in dimensions],
        "size": [len(codes) for _, codes in dimensions],
        "dimension": {
            name: {
                "label": name,
                "category": {
                    "index": {code: i for i, (code, _) in enumerate(codes)},
                    "label": dict(codes),
                },
            }
            for name, codes in dimensions
        },
        "value": values,
        "status": status,
        "role": {},
        "version": "2.0",
        "extension": {"px": {"decimals": 0}},
    }


GEO = "Kanton (-) / Bezirk (>>) / Gemeinde (......)"
Place = tuple[str, str, list[int]]  # code, label, the municipalities it sums


def _places(style: str, listing: dict[int, tuple[str, str]]) -> list[Place]:
    """The geographic dimension of a table: Switzerland, each canton, its district and its
    municipalities, coded and labelled as the table does (`population`, `census`, `farms`)."""
    places: list[Place] = [("8100" if style == "population" else "", "Schweiz", list(listing))]
    for canton, name in CANTON_NAMES.items():
        members = [n for n, (_, c) in listing.items() if c == canton]
        canton_label = f"- Kanton {name}" if style == "census" else f"- {name}"
        places.append((canton if style == "population" else "", canton_label, members))
        code, district = DISTRICTS[canton]
        places.append((code if style == "population" else "", f">> {district}", members))
        for number in members:
            places.append((f"{number:04d}" if style == "population" else "",
                           f"......{number:04d} {listing[number][0]}", [number]))  # fmt: skip
    # The other tables code their places by a running number.
    return [(code or str(i), label, members) for i, (code, label, members) in enumerate(places)]


def _single(codes: list[str], first: str = "") -> list[tuple[str, str]]:
    return [(code, first or code) for code in codes]


def population_totals() -> dict[str, Any]:
    """The inhabitants and the foreigners of every year."""
    places = {code: members for code, _, members in _places("population", EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        year, place, _, nationality, _, _ = key
        members = places[place]
        if nationality == "2":
            return sum(foreigners(n, int(year)) for n in members)
        return sum(sum(population_groups(n, int(year))) for n in members)

    return json_stat(
        "Ständige und nichtständige Wohnbevölkerung (made up)",
        [
            ("Jahr", _single([str(year) for year in POPULATION_YEARS])),
            (GEO, [(code, label) for code, label, _ in _places("population", EARLIER)]),
            ("Bevölkerungstyp", [("1", "Ständige Wohnbevölkerung")]),
            ("Staatsangehörigkeit (Kategorie)", [("-99999", "Total"), ("2", "Ausland")]),
            ("Geschlecht", [("-99999", "Geschlecht - Total")]),
            ("Alter", [("-99999", "Alter - Total")]),
        ],
        cell,
    )


def population_ages(year: int, first: int, last: int) -> dict[str, Any]:
    """The inhabitants of a year by single year of age, from `first` to `last`."""
    places = {code: members for code, _, members in _places("population", EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        _, place, _, _, _, age = key
        return sum(
            group
            for n in places[place]
            for at, group in zip(AGE_AT, population_groups(n, year), strict=True)
            if at == int(age)
        )

    return json_stat(
        "Ständige und nichtständige Wohnbevölkerung nach Alter (made up)",
        [
            ("Jahr", _single([str(year)])),
            (GEO, [(code, label) for code, label, _ in _places("population", EARLIER)]),
            ("Bevölkerungstyp", [("1", "Ständige Wohnbevölkerung")]),
            ("Staatsangehörigkeit (Kategorie)", [("-99999", "Total")]),
            ("Geschlecht", [("-99999", "Geschlecht - Total")]),
            ("Alter", [(str(age), f"{age} Jahre") for age in range(first, last + 1)]),
        ],
        cell,
    )


def birthplace() -> dict[str, Any]:
    """The inhabitants and those of them born abroad, of every year."""
    places = {code: members for code, _, members in _places("population", EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        year, place, _, born, _, _ = key
        members = places[place]
        if born == "2":
            return sum(born_abroad(n, int(year)) for n in members)
        return sum(sum(population_groups(n, int(year))) for n in members)

    return json_stat(
        "Ständige und nichtständige Wohnbevölkerung nach Geburtsort (made up)",
        [
            ("Jahr", _single([str(year) for year in POPULATION_YEARS])),
            (GEO, [(code, label) for code, label, _ in _places("population", EARLIER)]),
            ("Bevölkerungstyp", [("1", "Ständige Wohnbevölkerung")]),
            ("Geburtsort", [("-99999", "Geburtsort - Total"), ("2", "Im Ausland")]),
            ("Geschlecht", [("-99999", "Geschlecht - Total")]),
            ("Zivilstand", [("-99999", "Zivilstand - Total")]),
        ],
        cell,
    )


ELECTION_PLACES = "Bezirk (>>) / Gemeinde (......)"


def _election_places() -> list[Place]:
    """Each district before its municipalities; the Swiss abroad of ZH in a district of their
    own, as the real table has them."""
    places: list[Place] = []
    for canton in CANTON_NAMES:
        members = [n for n, (_, c) in EARLIER.items() if c == canton]
        code, district = DISTRICTS[canton]
        places.append((code, f">> {district}", members))
        places += [(f"{n:04d}", f"......{EARLIER[n][0]}", [n]) for n in members]
    return places + [
        ("009010", ">> ZH-Ausland-CH", [9010]),
        ("9010", "......ZH-Ausland-CH", [9010]),
    ]


def elections_description() -> dict[str, Any]:
    """The table's description (GET of the table): its dimensions and their values."""
    years = [str(year) for year in ELECTION_YEARS]
    return {
        "title": "Nationalratswahlen (Parteistimmen und Parteistärke seit 1971) (made up)",
        "variables": [
            {"code": ELECTION_PLACES, "text": ELECTION_PLACES,
             "values": [c for c, _, _ in _election_places()],
             "valueTexts": [label for _, label, _ in _election_places()]},
            {"code": "Jahr", "text": "Jahr", "values": years, "valueTexts": years},
            {"code": "Partei", "text": "Partei", "values": list(PARTIES),
             "valueTexts": list(PARTIES.values())},
            {"code": "Ergebnisse", "text": "Ergebnisse", "values": ["1", "2"],
             "valueTexts": ["Parteistimmen", "Parteistärke in %"]},
        ],
    }  # fmt: skip


def election(year: int) -> dict[str, Any]:
    """The party votes of one election per district and municipality."""
    places = {code: members for code, _, members in _election_places()}

    def votes_of(number: int) -> dict[str, int]:
        return {"1": 300, "3": 200} if number == 9010 else party_votes(number, year)

    def cell(key: tuple[str, ...]) -> int | None:
        place, _, party, _ = key
        given = [votes_of(n)[party] for n in places[place] if party in votes_of(n)]
        return sum(given) if given else None

    return json_stat(
        "Nationalratswahlen (made up)",
        [
            (ELECTION_PLACES, [(code, label) for code, label, _ in _election_places()]),
            ("Jahr", _single([str(year)])),
            ("Partei", list(PARTIES.items())),
            ("Ergebnisse", [("1", "Parteistimmen")]),
        ],
        cell,
    )


FARM_UNITS = {"15": "Tiere - Rinder", "0": "Betriebe",
              "10": "LN - Landwirtschaftliche Nutzfläche Total (in ha)"}  # fmt: skip
FARM_SYSTEMS = {"0": "Betriebssystem - Total", "1": "Biologische Betriebe"}


def farms(unit: str = "15", system: str = "0") -> dict[str, Any]:
    """One count of the farm structure survey, of every year: the cattle ("15"), the farms
    ("0") or the farmland ("10"), of all farms ("0") or of the organic ones ("1")."""
    places = {code: members for code, _, members in _places("farms", EARLIER)}
    year_of = {str(i): year for i, year in enumerate(FARM_YEARS)}

    def counted(number: int, year: int) -> int:
        if unit == "15":
            return cattle(number, year)
        return farms_of(number, year)[0 if unit == "0" else 1 + int(system)]

    def cell(key: tuple[str, ...]) -> int | None:
        _, place, _, year = key
        return sum(counted(n, year_of[year]) for n in places[place])

    return json_stat(
        "Landwirtschaftliche Betriebe und Nutztiere (made up)",
        [
            ("Beobachtungseinheit", [(unit, FARM_UNITS[unit])]),
            (GEO, [(code, label) for code, label, _ in _places("farms", EARLIER)]),
            ("Betriebssystem", [(system, FARM_SYSTEMS[system])]),
            ("Jahr", [(code, str(year)) for code, year in year_of.items()]),
        ],
        cell,
    )


def census() -> dict[str, Any]:
    """The census of 2000: the inhabitants by main language."""
    places = {code: members for code, _, members in _places("census", CENSUS_EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        _, place, _, language = key
        return sum(languages(n)[int(language)] for n in places[place])

    return json_stat(
        "Wohnbevölkerung 2000 nach Hauptsprache (made up)",
        [
            ("Wohnsitztyp", [("1", "Wirtschaftlicher Wohnsitz")]),
            (GEO, [(code, label) for code, label, _ in _places("census", CENSUS_EARLIER)]),
            ("Staatsangehörigkeit (Kategorie)", [("0", "Staatsangehörigkeit - Total")]),
            ("Hauptsprache", [("0", "Hauptsprachen - Total"), ("1", "Deutsch"),
                              ("2", "Französisch"), ("3", "Italienisch"),
                              ("4", "Rätoromanisch")]),
        ],
        cell,
    )  # fmt: skip


def _plain_places(swiss: str, digits: int, listing: dict[int, tuple[str, str]]) -> list[Place]:
    """The dimension "Gemeinde" of the tables that list municipalities only, beside one code for
    Switzerland: each municipality's number is its code and starts its label, without dots,
    padded to `digits` digits ("0001 Aeugst am Albis", or "1 Aeugst am Albis" with 1)."""
    return [(swiss, "Schweiz", list(listing))] + [
        (f"{number:0{digits}d}", f"{number:0{digits}d} {name}", [number])
        for number, (name, _) in listing.items()
    ]


JOB_YEARS = list(range(2011, 2025))
JOB_SECTORS = {"999": "Wirtschaftssektor - Total", "1": "Primärsektor", "2": "Sekundärer Sektor",
               "3": "Tertiärer Sektor"}  # fmt: skip


def jobs_counted(number: int, year: int) -> list[int]:
    """All jobs of a municipality at the end of a year, and those of the primary, the secondary
    and the tertiary sector, whether the table gives them or not."""
    base = BASES[number] // 2 + (year - 2011) * 3
    return [base, base // 10, base // 4, base - base // 10 - base // 4]


def jobs_of(number: int, year: int) -> list[int | None]:
    """The same as the table gives them, None for a count it withholds: two sectors of Meienried
    (389) in every year, and the primary sector of Bonstetten (3), now a part of Affoltern am
    Albis, in 2015."""
    counts: list[int | None] = list(jobs_counted(number, year))
    if number == 389:
        counts[2] = counts[3] = None
    if number == 3 and year == 2015:
        counts[1] = None
    return counts


def jobs(sectors: tuple[str, ...]) -> dict[str, Any]:
    """The employed persons of these sectors at the end of every year (STATENT), a withheld count
    written "X". Switzerland's figures count the withheld ones too, as the real table's do."""
    places = {code: members for code, _, members in _plain_places("99999", 1, EARLIER)}
    order = list(JOB_SECTORS)

    def cell(key: tuple[str, ...]) -> int | None:
        year, place, sector, _ = key
        if place == "99999":
            return sum(jobs_counted(n, int(year))[order.index(sector)] for n in places[place])
        return jobs_of(places[place][0], int(year))[order.index(sector)]

    return json_stat(
        "Arbeitsstätten und Beschäftigte nach Jahr, Gemeinde und Wirtschaftssektor (made up)",
        [
            ("Jahr", _single([str(year) for year in JOB_YEARS])),
            ("Gemeinde", [(c, label) for c, label, _ in _plain_places("99999", 1, EARLIER)]),
            ("Wirtschaftssektor", [(sector, JOB_SECTORS[sector]) for sector in sectors]),
            ("Beobachtungseinheit", [("2", "Beschäftigte")]),
        ],
        cell,
        sign="X",
    )


OCCUPANTS = {"1": "Mieter/in", "2": "Genossenschafter/in", "3": "Stockwerkeigentümer/in",
             "4": "Alleineigentümer/in des Hauses", "5": "Miteigentümer/in des Hauses",
             "6": "Inhaber/in einer Dienstwohnung", "7": "Inhaber/in einer Freiwohnung",
             "8": "Pächter/in"}  # fmt: skip


def dwellings_occupied(number: int, rooms: str, occupant: str) -> int:
    """The occupied dwellings of 2000 with a number of rooms and a kind of occupant."""
    return BASES[number] // 100 // int(occupant) + int(rooms)


def dwellings(rooms: tuple[str, ...], year: str = "2000") -> dict[str, Any]:
    """The buildings and dwellings survey of 2000: the occupied dwellings with these numbers of
    rooms by who lives in them. The real table also gives 1990; the query asks for 2000."""
    places = {code: members for code, _, members in _plain_places("CH", 4, CENSUS_EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        place, size, occupant, _ = key
        return sum(dwellings_occupied(n, size, occupant) for n in places[place])

    return json_stat(
        "Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Bewohnertyp und Jahr (made up)",
        [
            ("Gemeinde", [(c, label) for c, label, _ in _plain_places("CH", 4, CENSUS_EARLIER)]),
            ("Anzahl Zimmer", [(n, "10+ Zimmer" if n == "10" else f"{n} Zimmer") for n in rooms]),
            ("Bewohnertyp", list(OCCUPANTS.items())),
            ("Jahr", [(year, year)]),
        ],
        cell,
    )


BUILDING_KINDS = {"EFH": "Einfamilienhäuser", "Mehrfamilienhäuser": "Mehrfamilienhäuser",
                  "3": "Wohngebäude mit Nebennutzung", "1": "Gebäude mit teilweiser Wohnnutzung"}  # fmt: skip
BUILDING_PERIODS = {"1": "Vor 1919 erbaut", "2": "Zwischen 1919 und 1945 erbaut",
                    "3": "Zwischen 1946 und 1960 erbaut", "4": "Zwischen 1961 und 1970 erbaut",
                    "5": "Zwischen 1971 und 1980 erbaut", "6": "Zwischen 1981 und 1990 erbaut",
                    "7": "Zwischen 1991 und 1995 erbaut", "8": "Zwischen 1996 und 2000 erbaut"}  # fmt: skip


def buildings_built(number: int, kind: str, period: str) -> int:
    """The buildings with dwellings of a kind and a period of construction, in 2000."""
    return BASES[number] // 40 // (list(BUILDING_KINDS).index(kind) + 1) + int(period)


def buildings() -> dict[str, Any]:
    """The buildings and dwellings survey of 2000: the buildings with dwellings by kind and
    period of construction. The real table also gives 1990; the query asks for 2000."""
    places = {code: members for code, _, members in _plain_places("0000", 4, CENSUS_EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        place, kind, period, _ = key
        return sum(buildings_built(n, kind, period) for n in places[place])

    return json_stat(
        "Gebäude nach Gemeinde, Gebäudekategorie, Bauperiode und Jahr (made up)",
        [
            ("Gemeinde", [(c, label) for c, label, _ in _plain_places("0000", 4, CENSUS_EARLIER)]),
            ("Gebäudekategorie", list(BUILDING_KINDS.items())),
            ("Bauperiode", list(BUILDING_PERIODS.items())),
            ("Jahr", [("2000", "2000")]),
        ],
        cell,
    )


def religion() -> dict[str, Any]:
    """The census of 2000: the inhabitants by religion."""
    places = {code: members for code, _, members in _places("census", CENSUS_EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        _, place, code = key
        if code == "0":
            return sum(languages(n)[0] for n in places[place])
        return sum(religions(n).get(code, 0) for n in places[place])

    return json_stat(
        "Wohnbevölkerung 2000 nach Religion (made up)",
        [
            ("Wohnsitztyp", [("1", "Wirtschaftlicher Wohnsitz")]),
            (GEO, [(code, label) for code, label, _ in _places("census", CENSUS_EARLIER)]),
            ("Religion", list(RELIGIONS.items())),
        ],
        cell,
    )


def education() -> dict[str, Any]:
    """The census of 2000: the inhabitants by highest completed education."""
    places = {code: members for code, _, members in _places("census", CENSUS_EARLIER)}

    def cell(key: tuple[str, ...]) -> int | None:
        level, place, _, _ = key
        if level == "0":
            return sum(languages(n)[0] for n in places[place])
        return sum(education_levels(n)[level] for n in places[place])

    return json_stat(
        "Wohnbevölkerung 2000 nach höchster abgeschlossener Ausbildung (made up)",
        [
            ("Höchste abgeschlossene Ausbildung", list(EDUCATION_LEVELS.items())),
            (GEO, [(code, label) for code, label, _ in _places("census", CENSUS_EARLIER)]),
            ("Staatsangehörigkeit (Kategorie)", [("0", "Staatsangehörigkeit - Total")]),
            ("Geschlecht", [("0", "Geschlecht - Total")]),
        ],
        cell,
    )


def register_of(date: str) -> str:
    """The register's snapshot of an earlier date, as CSV text: the list a table uses."""
    listing = CENSUS_EARLIER if date == LIST_DATES["census"] else EARLIER
    lines = [REGISTER_HEADER]
    for abbreviation, (code, name, district) in REGISTER_CANTONS.items():
        position = POSITIONS[abbreviation]
        lines.append(f"{code},{position},12.09.1848,,1,,{name},{abbreviation},,,,")
        lines.append(f"{district},{position}01,01.01.2010,,2,{code},Bezirk {name},{name},,,,")
    for number, (name, canton) in listing.items():
        district = REGISTER_CANTONS[canton][2]
        lines.append(f"{12000 + number},{number},01.01.1960,,3,{district},{name},{name},,,,")
    return "\n".join(lines) + "\n"


CORRESPONDENCES_HEADER = (
    "InitialHistoricalCode,InitialCode,InitialName,InitialParentHistoricalCode,InitialParentName,"
    "InitialStep,TerminalHistoricalCode,TerminalCode,TerminalName,TerminalParentHistoricalCode,"
    "TerminalParentName,TerminalStep"
)


def correspondences(date: str) -> str:
    """The register's correspondences from the list of `date` to 2026-01-01, as CSV text: a row
    per municipality that changed and each municipality it is part of."""
    listing = CENSUS_EARLIER if date == LIST_DATES["census"] else EARLIER
    successors = CENSUS_SUCCESSORS if date == LIST_DATES["census"] else SUCCESSORS
    lines = [CORRESPONDENCES_HEADER]
    for number, terminals in successors.items():
        for terminal in terminals:
            name = MUNICIPALITIES[terminal][0]
            lines.append(f"{12000 + number},{number},{listing[number][0]},10053,Bezirk,29,"
                         f"{13000 + terminal},{terminal},{name},10053,Bezirk,26")  # fmt: skip
    return "\n".join(lines) + "\n"


AREA_FIELDS: list[Field] = [("OBJEKTART", "C"), ("BFS_NUMMER", "N"), ("NAME", "C"),
                            ("GEM_FLAECH", "N"), ("SEE_FLAECH", "N"), ("ICC", "C")]  # fmt: skip


def area_rows() -> list[list[Any]]:
    """swisstopo's records: the municipalities, a lake that belongs to a canton and a municipality
    of Liechtenstein, as the real layer has them; a test changes its copy."""
    rows: list[list[Any]] = [
        ["Gemeindegebiet", number, MUNICIPALITIES[number][0], area, lake, "CH"]
        for number, (area, lake) in AREAS.items()
    ]
    return rows + [["Kantonsgebiet", 9051, "Zürichsee (ZH)", 5584, 5584, "CH"],
                   ["Gemeindegebiet", 7001, "Vaduz", 1728, 0, "LI"]]  # fmt: skip


def swissboundaries(rows: list[list[Any]] | None = None) -> bytes:
    """swisstopo's ZIP of swissBOUNDARIES3D, with its layer of municipal areas only."""
    given = area_rows() if rows is None else rows
    shapes = [
        (row, [_square(2_600_000 + 1_000 * i, 1_200_000, 1_000)]) for i, row in enumerate(given)
    ]
    return _zip(_shapefile("swissBOUNDARIES3D_1_5_TLM_HOHEITSGEBIET", AREA_FIELDS, shapes))
