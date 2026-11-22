"""Which STAT-TAB tables give figures per municipality.

It asks STAT-TAB for its list of tables, then for the description of each (its title and its
variables with their values), and keeps the descriptions in the directory given, one file per
table. A table gives figures per municipality when one of its variables has at least 2,000
values. Standard library only.

It sends one request per table, 628 on 2026-11-22, about one a second. After them and the other
scripts' queries, STAT-TAB answered HTTP 429 for some minutes: run it once, and not beside the
others.

    python3 stat_tab_catalogue.py /path/outside/the/repository
"""

import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

API = "https://www.pxweb.bfs.admin.ch/api/v1/de/"
# STAT-TAB answers at most 50 queries in 15 seconds.
PAUSE = 0.35


def get(url: str) -> bytes:
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as answer:
                return answer.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or attempt == 4:
                raise
            time.sleep(15)
    raise AssertionError("unreachable")


def main(directory: pathlib.Path) -> None:
    tables = directory / "tables"
    tables.mkdir(parents=True, exist_ok=True)
    catalogue = json.loads(get(API))
    failed = []
    for entry in catalogue:
        table = entry["dbid"]
        target = tables / f"{table}.json"
        if target.exists():
            continue
        try:
            target.write_bytes(get(f"{API}{table}/{table}.px"))
        except (urllib.error.URLError, TimeoutError) as error:
            failed.append((table, str(error)))
        time.sleep(PAUSE)
    print(f"{len(catalogue)} tables, {len(failed)} without a description: {failed}")
    for path in sorted(tables.glob("*.json")):
        description = json.loads(path.read_text())
        large = [v for v in description["variables"] if len(v["values"]) >= 2000]
        if not large:
            continue
        years = next((v["valueTexts"] for v in description["variables"] if v["text"] == "Jahr"), [])
        when = f"{min(years)} to {max(years)} ({len(years)})" if years else "no year"
        print(f"{path.stem} | {len(large[0]['values'])} places | {when} | {description['title']}")


if __name__ == "__main__":
    main(pathlib.Path(sys.argv[1]))
