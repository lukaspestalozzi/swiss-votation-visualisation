"""Shared by the scripts of this investigation: the sources and how a file is fetched.

Every script is run as `python3 <script>.py <data directory>`. The data directory holds the
downloads (about 220 MB); keep it outside the repository. Only the standard library is used.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

# BFS, STAT-TAB: "Volksabstimmungen (Ergebnisse Ebene Gemeinde seit 1960)".
TABLE = "https://www.pxweb.bfs.admin.ch/api/v1/de/px-x-1703030000_101/px-x-1703030000_101.px"
# BFS, one file per vote day ("Echtzeitdaten am Abstimmungstag"); day as yyyymmdd.
FEED = "https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-{day}-eidgAbstimmung.json"
# Swissvotes, Année Politique Suisse, University of Bern; CC BY 4.0.
SWISSVOTES = "https://swissvotes.ch/page/dataset/swissvotes_dataset.csv"
# BFS, historicised register of municipalities; date as dd-mm-yyyy.
REGISTER = "https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date={date}"
# Federal Chancellery, popular votes as linked data (LINDAS).
SPARQL = "https://lindas.admin.ch/query"
# BFS, STAT-TAB tables with characteristics per municipality (metadata only).
PX_META = "https://www.pxweb.bfs.admin.ch/api/v1/de/{table}/{table}.px"
CHARACTERISTICS = {
    "px-x-0102010000_101": "population by nationality, sex and age",
    "px-x-1702020000_105": "party strength in the National Council elections",
    "px-x-0702000000_104": "farms, farmland and livestock",
}

SINCE = "2013-01-01"
REGISTER_DATES = ["2013-01-01", "2016-01-01", "2024-01-01", "2025-01-01", "2026-01-01"]
# The six cantons with half a cantonal vote (Federal Constitution, art. 142 para. 4).
HALF_VOTE = {"OW", "NW", "BS", "BL", "AR", "AI"}
# Codes of entries that are no municipality: Swiss abroad and similar, per canton.
FIRST_SPECIAL_CODE = 9000


def data_dir():
    if len(sys.argv) != 2:
        sys.exit(f"usage: python3 {os.path.basename(sys.argv[0])} <data directory>")
    os.makedirs(sys.argv[1], exist_ok=True)
    return sys.argv[1]


def fetch(url, path, body=None, headers=None, is_complete=json.loads):
    """Download `url` to `path` unless it is there. Returns False if the source has no such file.

    The file appears under its name only when the download is complete and `is_complete`
    accepts it, so an interrupted run leaves nothing that a later run would take for data.
    """
    if os.path.exists(path):
        return True
    request = urllib.request.Request(url, data=body, headers=headers or {})
    for attempt in range(6):
        try:
            content = urllib.request.urlopen(request, timeout=120).read()
            is_complete(content)
            break
        except urllib.error.HTTPError as error:
            if error.code in (403, 404):
                return False
            if attempt == 5:
                raise
        except (OSError, ValueError):
            if attempt == 5:
                raise
        time.sleep(3 * (attempt + 1))  # also the answer to HTTP 429 of the BFS API
    with open(path + ".part", "wb") as file:
        file.write(content)
    os.replace(path + ".part", path)
    return True


def load_json(directory, name):
    with open(os.path.join(directory, name), encoding="utf-8-sig") as file:
        return json.load(file)


def number(value):
    """The BFS table writes "..." where an entry has no result."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
