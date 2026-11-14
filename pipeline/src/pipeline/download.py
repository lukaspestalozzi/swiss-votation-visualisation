"""The addresses of the three sources, the Federal Chancellery's query, and the downloads."""

import string
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass

from pipeline.counts import SourceError

# Federal Statistical Office (BFS): one file per vote day; day as yyyymmdd.
FEED = "https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-{day}-eidgAbstimmung.json"
# BFS: the register of municipalities on a date; date as dd-mm-yyyy.
REGISTER = "https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date={date}"
# Federal Chancellery: the national results of the popular votes as linked data.
SPARQL = "https://lindas.admin.ch/query"
# The first day of the votes the data covers.
SINCE = "2013-01-01"

# One row per national result since SINCE, with the BFS's id. The Chancellery writes "" for a
# figure it does not give yet; the reader treats that as none.
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
  OPTIONAL { ?obs vote:ja ?yes ; vote:nein ?no . }
  OPTIONAL { ?obs vote:standesstimmenJa ?cy ; vote:standesstimmenNein ?cn . }
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


def fetch_url(request: Request) -> bytes | None:
    """Download over HTTPS. HTTP 403 and 404 mean that there is no such file; other failures
    are tried again, then stop the run with the address."""
    http = urllib.request.Request(request.address, data=request.body, headers=dict(request.headers))
    for attempt in range(6):
        try:
            with urllib.request.urlopen(http, timeout=120) as answer:
                content: bytes = answer.read()
                return content
        except urllib.error.HTTPError as error:
            if error.code in (403, 404):
                return None
            failure: Exception = error
        except OSError as error:
            failure = error
        time.sleep(3 * (attempt + 1))  # also the answer to HTTP 429 of the BFS
    raise SourceError(f"{request.address} cannot be reached: {failure}")
