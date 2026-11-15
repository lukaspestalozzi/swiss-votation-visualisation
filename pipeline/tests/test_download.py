import socket
import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

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
