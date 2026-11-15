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
# real tables on 2026-11-15 (investigations/characteristics.md).
ALL_CODES = {
    download.POPULATION: {"Jahr": 16, "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 2286},
    download.ELECTIONS: {"Bezirk (>>) / Gemeinde (......)": 2333, "Partei": 25},
    download.FARMS: {"Jahr": 28, "Kanton (-) / Bezirk (>>) / Gemeinde (......)": 2285},
    download.CENSUS_2000: {"Kanton (-) / Bezirk (>>) / Gemeinde (......)": 3107},
}


def test_no_query_asks_for_more_than_100000_cells() -> None:
    requests = [download.population_totals(), download.cattle(), download.census()]
    requests += [download.election(year) for year in (2011, 2015, 2019, 2023)]
    requests += [
        download.population_ages(year, first, last)
        for year in range(2012, 2026)
        for first, last in download.AGE_PARTS
    ]
    assert len(requests) == 49
    for request in requests:
        table = request.address.rsplit("/", 1)[1].removesuffix(".px")
        assert request.body is not None
        cells = 1
        for dimension in json.loads(request.body)["query"]:
            selection = dimension["selection"]
            given = len(selection["values"])
            cells *= ALL_CODES[table][dimension["code"]] if selection["filter"] == "all" else given
        assert cells <= 100_000, (table, cells)
