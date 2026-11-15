"""Shared by the scripts of this investigation: the sources of the characteristics, their download,
and how their figures are read and brought onto the list of municipalities of the votes.

Every script is run as `uv run --no-project --with pyshp==3.1.6 python <script>.py <data
directory>`; pyshp reads swisstopo's areas, everything else uses the standard library. The
downloads are about 60 MB; keep them outside the repository. It reuses `sources.py` of
`investigations/data-sources/`.
"""

import io
import json
import os
import re
import sys
import time
import zipfile
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data-sources"))

from sources import FIRST_SPECIAL_CODE, data_dir, fetch, load_json  # noqa: E402, F401

PX = "https://www.pxweb.bfs.admin.ch/api/v1/de/{table}/{table}.px"
GEO = "Kanton (-) / Bezirk (>>) / Gemeinde (......)"
# The tables, and the date of the register's list of municipalities each of them uses for all
# its years (found by check_characteristic_sources.py).
POPULATION = "px-x-0102010000_101"
ELECTIONS = "px-x-1702020000_105"
FARMS = "px-x-0702000000_104"
CENSUS_2000 = "px-x-4003000000_123"
LIST_DATE = {POPULATION: "06-04-2025", ELECTIONS: "01-01-2023", FARMS: "06-04-2025",
             CENSUS_2000: "05-12-2000"}
# The list of the votes (municipalities, add-vote-data).
VOTES_LIST = "01-01-2026"
REGISTER = "https://www.agvchapp.bfs.admin.ch/api/communes/{what}"
SWISSTOPO = ("https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_2026-01/"
             "swissboundaries3d_2026-01_2056_5728.shp.zip")
YEARS = [str(year) for year in range(2012, 2026)]  # population and cattle, end of each year
ELECTION_YEARS = ["2011", "2015", "2019", "2023"]
# The National Council elections (Federal Chancellery); the table gives only their years.
ELECTION_DAYS = {"2011": "2011-10-23", "2015": "2015-10-18", "2019": "2019-10-20",
                 "2023": "2023-10-22"}
# Five age groups, by the first and the last year of age; 100 stands for "100 and over".
AGE_GROUPS = [(0, 17), (18, 34), (35, 49), (50, 64), (65, 100)]
LANGUAGES = {"1": "German", "2": "French", "3": "Italian", "4": "Romansh"}
# The parties the characteristics name, by the table's codes: Die Mitte is CVP and BDP before
# 2021. Every other party is among "the others".
PARTY_GROUPS = {"FDP": ["1"], "Die Mitte": ["34", "2", "32"], "SP": ["3"], "SVP": ["4"],
                "GLP": ["31"], "Grüne": ["13"]}


def party_groups(codes, row):
    """A municipality's party votes (in the order of `codes`) as the votes of the named parties
    and, last, of the others together."""
    named = [sum(row[codes.index(c)] for c in group) for group in PARTY_GROUPS.values()]
    return [*named, sum(row) - sum(named)]


def item(code, values):
    return {"code": code, "selection": {"filter": "item", "values": values}}


def everything(code):
    return {"code": code, "selection": {"filter": "all", "values": ["*"]}}


def px_query(data, table, name, query):
    """Ask the BFS statistics API for one cube, unless it is there; return its file name."""
    path = os.path.join(data, f"{name}.json")
    if not os.path.exists(path):
        body = json.dumps({"query": query, "response": {"format": "json-stat2"}}).encode()
        fetch(PX.format(table=table), path, body=body,
              headers={"Content-Type": "application/json"})
        time.sleep(0.4)  # the API allows 50 calls in 15 seconds
    return f"{name}.json"


def download(data):
    """Everything the scripts read."""
    for table in LIST_DATE:
        fetch(PX.format(table=table), os.path.join(data, f"meta_{table}.json"))
    meta = load_json(data, f"meta_{FARMS}.json")
    farm_years = dict(zip(meta["variables"][3]["valueTexts"], meta["variables"][3]["values"]))
    px_query(data, POPULATION, "population_totals", [
        item("Jahr", YEARS), everything(GEO), item("Bevölkerungstyp", ["1"]),
        item("Staatsangehörigkeit (Kategorie)", ["-99999", "2"]), item("Geschlecht", ["-99999"]),
        item("Alter", ["-99999"])])
    for year in YEARS:
        for first, last in [(0, 33), (34, 66), (67, 100)]:  # 100,000 cells per call at most
            px_query(data, POPULATION, f"population_ages_{year}_{first}", [
                item("Jahr", [year]), everything(GEO), item("Bevölkerungstyp", ["1"]),
                item("Staatsangehörigkeit (Kategorie)", ["-99999"]),
                item("Geschlecht", ["-99999"]),
                item("Alter", [str(age) for age in range(first, last + 1)])])
    for year in ELECTION_YEARS:
        px_query(data, ELECTIONS, f"party_votes_{year}", [
            everything("Bezirk (>>) / Gemeinde (......)"), item("Jahr", [year]),
            everything("Partei"), item("Ergebnisse", ["1"])])
    px_query(data, FARMS, "cattle", [
        item("Beobachtungseinheit", ["15"]), everything(GEO), item("Betriebssystem", ["0"]),
        item("Jahr", [farm_years[year] for year in YEARS])])
    px_query(data, CENSUS_2000, "languages_2000", [
        item("Wohnsitztyp", ["1"]), everything(GEO),
        item("Staatsangehörigkeit (Kategorie)", ["0"]), item("Hauptsprache", ["0", *LANGUAGES])])
    for date in {*LIST_DATE.values(), VOTES_LIST}:
        fetch(REGISTER.format(what=f"snapshot?date={date}"),
              os.path.join(data, f"register_{date}.csv"), is_complete=lambda c: c.decode())
        if date != VOTES_LIST:
            fetch(REGISTER.format(
                what=f"correspondances?startPeriod={date}&endPeriod={VOTES_LIST}"),
                os.path.join(data, f"correspondences_{date}.csv"),
                is_complete=lambda c: c.decode())
    fetch(SWISSTOPO, os.path.join(data, "swissboundaries3d_2026-01.shp.zip"),
          is_complete=lambda c: zipfile.ZipFile(io.BytesIO(c)))


def cube(data, name):
    """A json-stat2 answer as {(code of each dimension, ...): value}, and the labels of the codes.

    A value the table does not give is None; `symbols` holds the sign the table writes for it.
    """
    answer = load_json(data, name)
    codes = [sorted(answer["dimension"][d]["category"]["index"].items(), key=lambda kv: kv[1])
             for d in answer["id"]]
    labels = {d: {code: answer["dimension"][d]["category"]["label"][code] for code, _ in dimension}
              for d, dimension in zip(answer["id"], codes)}  # in the table's order
    values, symbols = {}, {}
    for flat, value in enumerate(answer["value"]):
        key, rest = [], flat
        for dimension in reversed(codes):
            rest, index = divmod(rest, len(dimension))
            key.append(dimension[index][0])
        key = tuple(reversed(key))
        values[key] = value
        if value is None:
            symbols[key] = answer.get("status", {}).get(str(flat))
    return answer["id"], values, labels, symbols


def municipality(code, label):
    """The BFS number of a code of a table, or None for a canton, a district or Switzerland.

    The tables write a municipality's label with six dots; some put its number in the label,
    the others use it as the code.
    """
    if not label.startswith("......"):
        return None
    found = re.match(r"\.{6}(\d{4}) ", label)
    return int(found.group(1)) if found else int(code)


def register(data, date):
    """The municipalities of the register's list of a date: {number: (name, canton number)}."""
    import csv
    with open(os.path.join(data, f"register_{date}.csv"), encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))
    return {int(r["BfsCode"]): r["Name"] for r in rows if r["Level"] == "3"}


def successors(data, date):
    """{number on the list of `date`: the numbers on the votes' list it is part of}."""
    import csv
    result = defaultdict(set)
    with open(os.path.join(data, f"correspondences_{date}.csv"), encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            result[int(row["InitialCode"])].add(int(row["TerminalCode"]))
    # The register lists only the municipalities that changed; the others keep their number.
    today = set(register(data, VOTES_LIST))
    for number in register(data, date):
        if number not in result:
            if number not in today:
                raise SystemExit(f"{number} of {date}: neither on the list of {VOTES_LIST} "
                                 "nor in the correspondences")
            result[number] = {number}
    return dict(result)


def onto_votes_list(counts, data, date):
    """Counts per number of the list of `date`, added up per municipality of the votes' list.

    A number that is part of several of today's municipalities makes them one group: each of
    them gets the sum of the group (only the 2000 census has such a case).
    """
    after = successors(data, date)
    groups = {}
    for number, terminals in after.items():
        group = frozenset(terminals)
        for other in list(groups.values()):
            if other & group:
                group |= other
        for member in group:
            groups[member] = group
    sums = defaultdict(lambda: None)
    for number, value in counts.items():
        group = groups[min(after[number])]
        if value is None:
            continue
        old = sums[group]
        sums[group] = value if old is None else [a + b for a, b in zip(old, value)]
    return {member: sums[group] for member, group in groups.items()}, groups


def areas(data):
    """swisstopo's area of each municipality of the votes' list, and its part in lakes (ha)."""
    import shapefile  # pyshp

    archive = zipfile.ZipFile(os.path.join(data, "swissboundaries3d_2026-01.shp.zip"))
    stem = "swissBOUNDARIES3D_1_5_TLM_HOHEITSGEBIET"
    records = shapefile.Reader(dbf=io.BytesIO(archive.read(stem + ".dbf")),
                               encoding="utf-8").records()
    return {r["BFS_NUMMER"]: (r["GEM_FLAECH"], r["SEE_FLAECH"], r["NAME"]) for r in records
            if r["OBJEKTART"] == "Gemeindegebiet" and r["ICC"] == "CH"}
