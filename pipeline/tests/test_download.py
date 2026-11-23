import json
import socket
import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from pipeline import download
from pipeline.counts import SourceError
from pipeline.download import BOUNDARIES, THEMAKART, THEMAKART_YEAR, Request, fetch_url


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/there.json":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"there": true}')
        else:
            self.send_error(404)

    def log_message(self, format: str, *args: object) -> None:
        pass


@pytest.fixture
def server() -> Iterator[str]:
    httpd = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}"
    httpd.shutdown()
    httpd.server_close()


def test_a_file_is_returned_and_a_missing_one_is_none(server: str) -> None:
    assert fetch_url(Request(f"{server}/there.json")) == b'{"there": true}'
    assert fetch_url(Request(f"{server}/missing.json")) is None


def test_a_server_that_cannot_be_reached_stops_and_is_named(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    attempts: list[float] = []
    monkeypatch.setattr("pipeline.download.time.sleep", attempts.append)
    address = f"http://127.0.0.1:{port}/closed.json"
    with pytest.raises(SourceError, match=rf"^{address} cannot be reached: "):
        fetch_url(Request(address))
    assert attempts == [3, 6, 9, 12, 15, 18]


def test_the_addresses_of_the_maps_sources() -> None:
    # As read in investigations/map-data.md.
    assert BOUNDARIES.format(division="Commune", date="01-01-2026") == (
        "https://www.agvchapp.bfs.admin.ch/api/boundaries/divisions?division=Commune"
        "&resolution=K4&dissolve=true&date=01-01-2026&format=shp"
    )
    assert THEMAKART == "https://dam-api.bfs.admin.ch/hub/api/dam/assets/36390072/master"
    assert THEMAKART_YEAR == 2026


# The number of codes of each dimension that a query asks for with the filter "all", in the
# real tables on 2026-11-15 (investigations/characteristics.md) and, for the tables from the
# place of birth on, on 2026-11-22 (investigations/more-characteristics.md).
ALL_CODES = {
    download.POPULATION: {"Jahr": 16, "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 2286},
    download.ELECTIONS: {"Bezirk (>>) / Gemeinde (......)": 2333, "Partei": 25},
    download.FARMS: {"Jahr": 28, "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 2285},
    download.CENSUS_2000: {"Kanton (-) / Bezirk (>>) / Gemeinde (......)": 3107},
    download.BIRTHPLACE: {"Jahr": 16, "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 2286},
    download.JOBS: {"Jahr": 14, "Gemeinde": 2132},
    download.RELIGION_2000: {
        "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 3107,
        "Religion": 19,
    },
    download.EDUCATION_2000: {
        "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 3107,
        "Höchste abgeschlossene Ausbildung": 14,
    },
    download.DWELLINGS_2000: {"Gemeinde": 2897, "Bewohnertyp": 8},
    download.BUILDINGS_2000: {"Gemeinde": 2897, "Gebäudekategorie": 4, "Bauperiode": 8},
}


def test_no_query_asks_for_more_than_100000_cells() -> None:
    requests = [download.population_totals(), download.cattle(), download.census()]
    requests += [download.election(year) for year in (2011, 2015, 2019, 2023)]
    requests += [
        download.population_ages(year, first, last)
        for year in range(2012, 2026)
        for first, last in download.AGE_PARTS
    ]
    requests += [download.born_abroad(), download.religion(), download.education()]
    requests += [download.farms(), download.farmland(), download.organic_farmland()]
    requests += [download.jobs(sectors) for sectors in download.JOB_PARTS]
    requests += [download.dwellings(rooms) for rooms in download.ROOM_PARTS]
    requests += [download.buildings()]
    assert len(requests) == 61
    for request in requests:
        table = request.address.rsplit("/", 1)[1].removesuffix(".px")
        assert request.body is not None
        cells = 1
        for dimension in json.loads(request.body)["query"]:
            selection = dimension["selection"]
            given = len(selection["values"])
            cells *= ALL_CODES[table][dimension["code"]] if selection["filter"] == "all" else given
        assert cells <= 100_000, (table, cells)


def asked(request: Request) -> dict[str, tuple[str, list[str]]]:
    """What a query asks of each dimension it names: the filter and its values."""
    assert request.body is not None
    return {
        dimension["code"]: (dimension["selection"]["filter"], dimension["selection"]["values"])
        for dimension in json.loads(request.body)["query"]
    }


PLACES = "Kanton (-) / Bezirk (>>) / Gemeinde (......)"
EVERY = ("all", ["*"])


def test_the_query_of_those_born_abroad() -> None:
    # The dimensions and codes of the table on 2026-11-22 (investigations/more-characteristics.md).
    request = download.born_abroad()
    assert request.address.endswith(f"/{download.BIRTHPLACE}/{download.BIRTHPLACE}.px")
    assert download.BIRTHPLACE == "px-x-0102010000_100"
    assert asked(request) == {
        "Jahr": EVERY,
        PLACES: EVERY,
        "Bevölkerungstyp": ("item", ["1"]),
        "Geburtsort": ("item", ["-99999", "2"]),
        "Geschlecht": ("item", ["-99999"]),
        "Zivilstand": ("item", ["-99999"]),
    }
    assert download.LIST_DATES[download.BIRTHPLACE] == "2025-04-06"


def test_the_two_queries_of_the_jobs() -> None:
    # By sectors, as the pipeline does not know the table's years before it asks (design of
    # add-more-characteristics, decision 11).
    assert download.JOBS == "px-x-0602010000_102"
    assert download.JOB_PARTS == (("999", "1"), ("2", "3"))
    for sectors in download.JOB_PARTS:
        assert asked(download.jobs(sectors)) == {
            "Jahr": EVERY,
            "Gemeinde": EVERY,
            "Wirtschaftssektor": ("item", list(sectors)),
            "Beobachtungseinheit": ("item", ["2"]),
        }
    assert download.LIST_DATES[download.JOBS] == "2024-01-01"


def test_the_four_queries_of_the_farms_table() -> None:
    # One query per count: the cattle of before, the farms, the farmland and the organic farmland.
    queries = {"15": download.cattle(), "0": download.farms(), "10": download.farmland()}
    for unit, request in queries.items():
        assert asked(request) == {
            "Beobachtungseinheit": ("item", [unit]),
            PLACES: EVERY,
            "Betriebssystem": ("item", ["0"]),
            "Jahr": EVERY,
        }
    assert asked(download.organic_farmland()) == {
        "Beobachtungseinheit": ("item", ["10"]),
        PLACES: EVERY,
        "Betriebssystem": ("item", ["1"]),
        "Jahr": EVERY,
    }


def test_the_query_of_the_religions() -> None:
    assert download.RELIGION_2000 == "px-x-4003000000_122"
    assert asked(download.religion()) == {
        "Wohnsitztyp": ("item", ["1"]),
        PLACES: EVERY,
        "Religion": EVERY,
    }
    assert download.LIST_DATES[download.RELIGION_2000] == "2000-12-05"


def test_the_query_of_the_education() -> None:
    assert download.EDUCATION_2000 == "px-x-4003000000_161"
    assert asked(download.education()) == {
        "Höchste abgeschlossene Ausbildung": EVERY,
        PLACES: EVERY,
        "Staatsangehörigkeit (Kategorie)": ("item", ["0"]),
        "Geschlecht": ("item", ["0"]),
    }
    assert download.LIST_DATES[download.EDUCATION_2000] == "2000-12-05"


def test_the_three_queries_of_the_dwellings() -> None:
    # The table also gives 1990; the query names the year it wants.
    assert download.DWELLINGS_2000 == "px-x-0903020000_113"
    assert download.ROOM_PARTS == (("1", "2", "3", "4"), ("5", "6", "7", "8"), ("9", "10"))
    for rooms in download.ROOM_PARTS:
        assert asked(download.dwellings(rooms)) == {
            "Gemeinde": EVERY,
            "Anzahl Zimmer": ("item", list(rooms)),
            "Bewohnertyp": EVERY,
            "Jahr": ("item", ["2000"]),
        }
    assert download.LIST_DATES[download.DWELLINGS_2000] == "2000-12-05"


def test_the_query_of_the_buildings() -> None:
    assert download.BUILDINGS_2000 == "px-x-0902020100_114"
    assert asked(download.buildings()) == {
        "Gemeinde": EVERY,
        "Gebäudekategorie": EVERY,
        "Bauperiode": EVERY,
        "Jahr": ("item", ["2000"]),
    }
    assert download.LIST_DATES[download.BUILDINGS_2000] == "2000-12-05"
