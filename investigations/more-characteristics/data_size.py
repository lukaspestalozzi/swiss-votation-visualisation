"""How much each group of candidate figures would add to the site's data file of the
characteristics: its counts on the votes' list, written as compact JSON, in bytes and
compressed with gzip. It reads what `census_2000.py`, `candidate_tables.py` and
`register_levels.py` downloaded. Standard library only.

    python3 data_size.py /path/outside/the/repository
"""

import contextlib
import csv
import gzip
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import candidate_tables as tables  # noqa: E402
import census_2000 as census  # noqa: E402
from figures import GEO, VOTES_LIST, data_dir, onto_votes_list, register  # noqa: E402


def quiet(function, *arguments):
    with contextlib.redirect_stdout(io.StringIO()):
        return function(*arguments)


def size(name, value):
    text = json.dumps(value, separators=(",", ":")).encode()
    print(f"{name}: {len(text):,} bytes, {len(gzip.compress(text, 9)):,} with gzip")
    return value


def yearly(data, table, counts, years, keys_of):
    """Per year, per municipality of the votes' list, the counts `keys_of(year)` names."""
    numbers = sorted(register(data, VOTES_LIST))
    result = []
    for year in years:
        rows = tables.on_votes_list(data, table, tables.rows_of(counts, keys_of(year)))
        result.append([rows[n] for n in numbers])
    return result


def main():
    data = data_dir()
    numbers = sorted(register(data, VOTES_LIST))
    with open(tables.SITE, "rb") as file:
        held = file.read()
    print(f"the site's file today: {len(held):,} bytes, {len(gzip.compress(held, 9)):,} with gzip")

    with contextlib.redirect_stdout(io.StringIO()):
        religion, codes, _ = census.per_municipality(data, "religion_2000", "Religion")
        wanted = ["0", census.REFORMED, census.CATHOLIC, census.NONE]
        religion, _ = onto_votes_list(
            {n: [row[c] for c in wanted] for n, row in religion.items()}, data, census.LIST)
        education, codes, _ = census.per_municipality(
            data, "education_2000", "Höchste abgeschlossene Ausbildung")
        groups = [census.LEVELS[name] for name in
                  ("none or compulsory school", "upper secondary", "tertiary")]
        education, _ = onto_votes_list(
            {n: [sum(row[c] for c in group) for group in groups]
             for n, row in education.items()}, data, census.LIST)
    held, _ = quiet(tables.counts_of, data, [f"dwellings_2000_{r}.json" for r in ("1", "5", "9")],
                    "Gemeinde", tables.DWELLINGS_2000)
    dwellings = {}
    for (number, _, occupant, _), value in held.items():
        row = dwellings.setdefault(number, [0, 0])
        row[0] += value
        row[1] += value if occupant in ("3", "4", "5") else 0
    dwellings = tables.on_votes_list(data, tables.DWELLINGS_2000, dwellings)
    held, _ = quiet(tables.counts_of, data, ["buildings_2000.json"], "Gemeinde",
                    tables.BUILDINGS_2000)
    buildings = {}
    for (number, kind, _, _), value in held.items():
        row = buildings.setdefault(number, [0, 0])
        row[0] += value
        row[1] += value if kind == "EFH" else 0
    buildings = tables.on_votes_list(data, tables.BUILDINGS_2000, buildings)
    size("religion of 2000 (all, Evangelical Reformed, Roman Catholic, no affiliation)",
         [religion[n] for n in numbers])
    size("education of 2000 (three levels)", [education[n] for n in numbers])
    size("dwellings of 2000 (occupied, by their owner)", [dwellings[n] for n in numbers])
    size("buildings of 2000 (with dwellings, single-family houses)",
         [buildings[n] for n in numbers])

    with contextlib.redirect_stdout(io.StringIO()):
        held, _ = tables.counts_of(data, ["birthplace.json"], GEO, tables.BIRTHPLACE)
        born = {(n, year, place): v for (n, year, _, place, _, _), v in held.items()}
        held, _ = tables.counts_of(data, ["jobs_2011.json", "jobs_2018.json"], "Gemeinde",
                                   tables.JOBS)
        jobs = {(n, year, sector): v for (n, year, sector, _), v in held.items()}
        held, _ = tables.counts_of(data, ["turnout.json"], GEO, tables.TURNOUT)
        turnout = {(n, year, what): v for (n, year, what), v in held.items()}
        held, _ = tables.counts_of(data, ["farms.json", "farmland.json"], GEO, tables.FARMS)
        farms = {(n, year, unit, system): v for (n, unit, system, year), v in held.items()}
    size("born abroad, 14 years (one count; the inhabitants are in the file)",
         yearly(data, tables.BIRTHPLACE, born, tables.YEARS, lambda y: [(y, "2")]))
    job_years = [str(year) for year in range(2011, 2025)]
    size("jobs, 14 years (all sectors)",
         yearly(data, tables.JOBS, jobs, job_years, lambda y: [(y, "999")]))
    by_sector = []
    for sector in ("1", "2", "3"):
        by_sector.append(yearly(data, tables.JOBS, jobs, job_years, lambda y: [(y, sector)]))
    size("jobs, 14 years (each of the three sectors, apart)", by_sector)
    size("turnout, 4 elections (entitled, voters)",
         yearly(data, tables.TURNOUT, turnout, ["2011", "2015", "2019", "2023"],
                lambda y: [(y, "1"), (y, "2")]))
    with open(os.path.join(data, "tables", f"{tables.FARMS}.json"), encoding="utf-8") as file:
        variable = next(v for v in json.load(file)["variables"] if v["code"] == "Jahr")
    code = dict(zip(variable["valueTexts"], variable["values"]))
    size("farms, 14 years (farms, farmland, organic farmland)",
         yearly(data, tables.FARMS, farms, [code[y] for y in tables.YEARS],
                lambda y: [(y, "0", "0"), (y, "10", "0"), (y, "10", "1")]))

    with open(os.path.join(data, f"levels_{VOTES_LIST}.csv"), encoding="utf-8-sig") as file:
        levels = {int(row["BfsCode"]): row for row in csv.DictReader(file)}
    for columns in (["STALAN2020"], ["STALAN2020", "GDETYP2020_9", "SPRGEB2020", "MONT2019"]):
        size(f"classes ({', '.join(columns)})",
             [[int(levels[n][c]) for c in columns] for n in numbers])


if __name__ == "__main__":
    main()
