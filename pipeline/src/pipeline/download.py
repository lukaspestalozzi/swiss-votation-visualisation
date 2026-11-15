"""The addresses of the sources, the queries they are asked, and the downloads."""

import json
import string
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pipeline.counts import SourceError

# Federal Statistical Office (BFS): one file per vote day; day as yyyymmdd.
FEED = "https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-{day}-eidgAbstimmung.json"
# BFS: the register of municipalities on a date; date as dd-mm-yyyy.
REGISTER = "https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date={date}"
# BFS register: the K4 boundaries of a division (Commune, Canton, Country) on a date, as a ZIP
# of a shapefile in LV95; date as dd-mm-yyyy.
BOUNDARIES = (
    "https://www.agvchapp.bfs.admin.ch/api/boundaries/divisions?division={division}"
    "&resolution=K4&dissolve=true&date={date}&format=shp"
)
# BFS: the ThemaKart set of 2026, map geometries for thematic maps; the map takes its lakes,
# which are valid for all years (investigations/map-data.md).
THEMAKART = "https://dam-api.bfs.admin.ch/hub/api/dam/assets/36390072/master"
THEMAKART_YEAR = 2026
# Federal Chancellery: the national results of the popular votes as linked data.
SPARQL = "https://lindas.admin.ch/query"
# The first day of the votes the data covers.
SINCE = "2013-01-01"

# The characteristics (investigations/characteristics.md). The BFS statistics API (STAT-TAB)
# answers a query of a table, POSTed in JSON, in json-stat2; a GET of the address describes the
# table. A query names every dimension: one it leaves out is summed up silently.
STAT_TAB = "https://www.pxweb.bfs.admin.ch/api/v1/de/{table}/{table}.px"
POPULATION = "px-x-0102010000_101"
ELECTIONS = "px-x-1702020000_105"
FARMS = "px-x-0702000000_104"
CENSUS_2000 = "px-x-4003000000_123"
# The date of the register's list each table gives for all its years. When STAT-TAB moves a
# table to a newer list, the update stops; the new date goes here (pipeline/README.md).
LIST_DATES = {POPULATION: "2025-04-06", ELECTIONS: "2023-01-01", FARMS: "2025-04-06",
              CENSUS_2000: "2000-12-05"}  # fmt: skip
# STAT-TAB answers at most 100,000 cells per query and 50 queries in 15 seconds.
STAT_TAB_PAUSE = 0.4
# A year's single years of age, in three queries.
AGE_PARTS = ((0, 33), (34, 66), (67, 100))
# The days of the National Council elections, as the Federal Council's circulars to the cantons
# give them (Federal Gazette; investigations/characteristics.md). The table gives the years.
ELECTION_DAYS = {2011: "2011-10-23", 2015: "2015-10-18", 2019: "2019-10-20", 2023: "2023-10-22"}
# BFS register: the municipalities of a list that changed until another date, and what they are
# part of then; dates as dd-mm-yyyy.
CORRESPONDENCES = (
    "https://www.agvchapp.bfs.admin.ch/api/communes/correspondances"
    "?startPeriod={start}&endPeriod={end}"
)
# swisstopo: swissBOUNDARIES3D of 2026-01. Its areas must be those of the votes' list; the update
# stops when they are not (a newer release is taken by changing the address).
SWISSBOUNDARIES = (
    "https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_2026-01/"
    "swissboundaries3d_2026-01_2056_5728.shp.zip"
)

# One row per national result since SINCE, with the BFS's id. The Chancellery writes "" for a
# figure it does not give yet; the reader treats that as none. Each figure has an OPTIONAL of its
# own, so that a result given on one side only reaches the reader, which refuses it.
QUERY = string.Template("""
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX vote: <https://politics.ld.admin.ch/political-rights/popular-vote/>
SELECT ?date ?number ?id ?result ?yes ?no ?cy ?cn
       ?srcde ?srcfr ?srcit ?notede ?notefr ?noteit WHERE {
  ?obs a cube:Observation ; vote:date ?date ; vote:abstimmungsNummerBk ?number ;
       vote:id ?id ; vote:ergebnis ?result .
  OPTIONAL { ?obs vote:region ?region . }
  FILTER(!BOUND(?region) || ?region = <https://ld.admin.ch/country/CHE>)
  OPTIONAL { ?obs vote:ja ?yes . }
  OPTIONAL { ?obs vote:nein ?no . }
  OPTIONAL { ?obs vote:standesstimmenJa ?cy . }
  OPTIONAL { ?obs vote:standesstimmenNein ?cn . }
  OPTIONAL { ?obs vote:quelle ?source .
    OPTIONAL { ?source schema:name ?srcde . FILTER(LANG(?srcde) = "de") }
    OPTIONAL { ?source schema:name ?srcfr . FILTER(LANG(?srcfr) = "fr") }
    OPTIONAL { ?source schema:name ?srcit . FILTER(LANG(?srcit) = "it") } }
  OPTIONAL { ?obs vote:anmerkung ?note .
    OPTIONAL { ?note schema:name ?notede . FILTER(LANG(?notede) = "de") }
    OPTIONAL { ?note schema:name ?notefr . FILTER(LANG(?notefr) = "fr") }
    OPTIONAL { ?note schema:name ?noteit . FILTER(LANG(?noteit) = "it") } }
  FILTER(?date >= "$since"^^xsd:date)
} ORDER BY ?date ?id
""").substitute(since=SINCE)


@dataclass(frozen=True)
class Request:
    """What to ask a source for: its address, and for a query its body and headers."""

    address: str
    body: bytes | None = None
    headers: tuple[tuple[str, str], ...] = ()


# Answers the content of a request, or None where the source has no such file.
Fetch = Callable[[Request], bytes | None]


def chancellery_request() -> Request:
    return Request(
        SPARQL,
        urllib.parse.urlencode({"query": QUERY}).encode(),
        (
            ("Accept", "application/sparql-results+json"),
            ("Content-Type", "application/x-www-form-urlencoded"),
        ),
    )


PLACES = "Kanton (-) / Bezirk (>>) / Gemeinde (......)"


def _item(code: str, values: list[str]) -> dict[str, Any]:
    return {"code": code, "selection": {"filter": "item", "values": values}}


def _all(code: str) -> dict[str, Any]:
    return {"code": code, "selection": {"filter": "all", "values": ["*"]}}


def stat_tab(table: str, query: list[dict[str, Any]]) -> Request:
    """A query of a STAT-TAB table, answered in json-stat2."""
    body = json.dumps({"query": query, "response": {"format": "json-stat2"}})
    return Request(
        STAT_TAB.format(table=table), body.encode(), (("Content-Type", "application/json"),)
    )


def description(table: str) -> Request:
    """A STAT-TAB table's description: its dimensions and their codes."""
    return Request(STAT_TAB.format(table=table))


def _people(nationalities: list[str], ages: list[str]) -> list[dict[str, Any]]:
    return [
        _all(PLACES),
        _item("Bevölkerungstyp", ["1"]),
        _item("Staatsangehörigkeit (Kategorie)", nationalities),
        _item("Geschlecht", ["-99999"]),
        _item("Alter", ages),
    ]


def population_totals() -> Request:
    """The permanent resident population and its foreigners, every year."""
    return stat_tab(POPULATION, [_all("Jahr"), *_people(["-99999", "2"], ["-99999"])])


def population_ages(year: int, first: int, last: int) -> Request:
    """The permanent resident population of a year by single year of age."""
    ages = [str(age) for age in range(first, last + 1)]
    return stat_tab(POPULATION, [_item("Jahr", [str(year)]), *_people(["-99999"], ages)])


def election(year: int) -> Request:
    """The votes of every party in a National Council election, per district and municipality."""
    return stat_tab(
        ELECTIONS,
        [
            _all("Bezirk (>>) / Gemeinde (......)"),
            _item("Jahr", [str(year)]),
            _all("Partei"),
            _item("Ergebnisse", ["1"]),
        ],
    )


def cattle() -> Request:
    """The cattle of the farm structure survey, every year."""
    return stat_tab(
        FARMS,
        [_item("Beobachtungseinheit", ["15"]), _all(PLACES), _item("Betriebssystem", ["0"]),
         _all("Jahr")],
    )  # fmt: skip


def census() -> Request:
    """The census of 2000: the inhabitants (economic residence) by main language."""
    return stat_tab(
        CENSUS_2000,
        [_item("Wohnsitztyp", ["1"]), _all(PLACES),
         _item("Staatsangehörigkeit (Kategorie)", ["0"]),
         _item("Hauptsprache", ["0", "1", "2", "3", "4"])],
    )  # fmt: skip


def fetch_url(request: Request) -> bytes | None:
    """Download over HTTPS. HTTP 403 and 404 mean that there is no such file; other failures
    are tried again, then stop the run with the address."""
    http = urllib.request.Request(request.address, data=request.body, headers=dict(request.headers))
    for attempt in range(6):
        try:
            with urllib.request.urlopen(http, timeout=120) as answer:
                content: bytes = answer.read()
            if request.address.startswith(STAT_TAB.split("{", 1)[0]):
                time.sleep(STAT_TAB_PAUSE)
            return content
        except urllib.error.HTTPError as error:
            if error.code in (403, 404):
                return None
            failure: Exception = error
        except OSError as error:
            failure = error
        time.sleep(3 * (attempt + 1))  # also the answer to HTTP 429 of the BFS
    raise SourceError(f"{request.address} cannot be reached: {failure}")
