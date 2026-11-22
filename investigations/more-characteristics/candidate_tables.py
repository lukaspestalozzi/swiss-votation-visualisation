"""Further figures STAT-TAB gives per municipality, as candidates for characteristics: jobs by
sector, inhabitants born abroad, turnout at National Council elections, farms and farmland, and
from the census of 2000 owners among the occupied dwellings and single-family houses.

For each it asks STAT-TAB for the counts, checks that they are whole numbers, where one is
missing and whether the municipalities add up to the table's Switzerland, brings them onto the
votes' list through the register's correspondences from the table's list (`table_lists.py`
finds its date), and prints how the candidate's value spreads over the 2,110 municipalities and
the values of named ones. Standard library only; it reuses `figures.py` of
`investigations/characteristics/`.

    python3 candidate_tables.py /path/outside/the/repository
"""

import json
import os
import statistics
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "characteristics"))

from figures import (  # noqa: E402
    FIRST_SPECIAL_CODE, GEO, REGISTER, VOTES_LIST, cube, data_dir, everything, fetch, item,
    municipality, onto_votes_list, px_query, register, successors,
)

JOBS = "px-x-0602010000_102"
BIRTHPLACE = "px-x-0102010000_100"
TURNOUT = "px-x-1702020000_101"
FARMS = "px-x-0702000000_104"
# Each has a sibling without a year (`_103`, `_107`); these two name the year they are asked for.
DWELLINGS_2000 = "px-x-0903020000_113"
BUILDINGS_2000 = "px-x-0902020100_114"
# The register's list each table gives (table_lists.py).
LIST = {JOBS: "01-01-2024", BIRTHPLACE: "06-04-2025", TURNOUT: "01-01-2023",
        FARMS: "06-04-2025", DWELLINGS_2000: "05-12-2000", BUILDINGS_2000: "05-12-2000"}
YEARS = [str(year) for year in range(2012, 2026)]
# The site's own data file: the inhabitants at the end of each year and the area, on the votes'
# list.
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "app", "static",
                    "data", "characteristics.json")
NAMED = {261: "Zürich", 6172: "Bister", 1061: "Luzern", 6621: "Genève", 5192: "Lugano",
         3506: "Vaz/Obervaz", 351: "Bern", 4001: "Aarau"}


def lists(data):
    for date in {*LIST.values(), VOTES_LIST}:
        fetch(REGISTER.format(what=f"snapshot?date={date}"),
              os.path.join(data, f"register_{date}.csv"), is_complete=lambda c: c.decode())
        if date != VOTES_LIST:
            fetch(REGISTER.format(
                what=f"correspondances?startPeriod={date}&endPeriod={VOTES_LIST}"),
                os.path.join(data, f"correspondences_{date}.csv"),
                is_complete=lambda c: c.decode())


def number_of(code, label):
    """The BFS number of a table's place, or None for Switzerland, a canton or a district."""
    if label.startswith("......"):
        number = municipality(code, label)
    elif code.isdigit() and label not in ("Schweiz",) and not label.startswith(("-", ">>", "<<")):
        number = int(code)
    else:
        return None
    return number if 0 < number < FIRST_SPECIAL_CODE else None


def counts_of(data, names, place, table):
    """{(number, the other codes...): count} of the cubes `names`, and what the checks found."""
    counts, missing, fractions, swiss = {}, {}, 0, {}
    for name in names:
        ids, values, labels, symbols = cube(data, name)
        at = ids.index(place)
        for key, value in values.items():
            rest = key[:at] + key[at + 1:]
            if labels[place][key[at]] == "Schweiz":
                swiss[rest] = value
            number = number_of(key[at], labels[place][key[at]])
            if number is None:
                continue
            counts[(number, *rest)] = value
            if value is None:
                missing[(number, *rest)] = symbols[key]
            elif value != int(value):
                fractions += 1
    numbers = {key[0] for key in counts}
    listed = set(register(data, LIST[table]))
    sums = {}
    for (number, *rest), value in counts.items():
        if value is not None:
            sums[tuple(rest)] = sums.get(tuple(rest), 0) + value
    unequal = sum(sums.get(rest) != value for rest, value in swiss.items() if value is not None)
    counts_of.switzerland, counts_of.sums = swiss, sums
    print(f"  {len(numbers)} municipalities; against the register of {LIST[table]}: "
          f"{len(numbers - listed)} not in it, {len(listed - numbers)} of it missing")
    print(f"  cells: {len(counts):,}; without a value: {len(missing):,} (signs "
          f"{sorted(set(missing.values()), key=str)}); with a fraction: {fractions}; sums over "
          f"the municipalities that differ from the table's Switzerland: {unequal} of {len(swiss)}")
    return counts, missing


def on_votes_list(data, table, rows, skip_missing=False):
    """`rows` ({number: [counts] or None}) added up onto the votes' list.

    A municipality made of several has none when one of its parts has none. `figures.py` adds up
    the parts that have counts, as the earlier investigation did for the elections; with
    `skip_missing` this does the same.
    """
    result, groups = onto_votes_list(rows, data, LIST[table])
    if not skip_missing:
        after = successors(data, LIST[table])
        for number, row in rows.items():
            if row is None:
                for member in groups[min(after[number])]:
                    result[member] = None
    return result


def spread(name, values, unit="%", digits=2):
    known = sorted(v for v in values.values() if v is not None)
    deciles = statistics.quantiles(known, n=10)
    print(f"  {name}: {len(known)} of {len(values)} with a figure; least {known[0]:.{digits}f}{unit}, "
          f"1st decile {deciles[0]:.{digits}f}{unit}, median "
          f"{statistics.median(known):.{digits}f}{unit}, 9th decile {deciles[8]:.{digits}f}{unit}, "
          f"most {known[-1]:.{digits}f}{unit}")


def named(label, values, unit="%", digits=2):
    print("  " + label + ": " + ", ".join(
        f"{name} {'none' if values[number] is None else f'{values[number]:.{digits}f}{unit}'}"
        for number, name in NAMED.items()))


def share(part, whole):
    return None if not whole else 100 * part / whole


def site():
    """{year: {number: inhabitants}} and {number: hectares}, from the site's data file."""
    with open(SITE, encoding="utf-8") as file:
        held = json.load(file)
    numbers = held["municipalities"]
    people = {str(year): {n: row[0] for n, row in zip(numbers, rows)}
              for year, rows in zip(held["population"]["years"], held["population"]["counts"])}
    return people, dict(zip(numbers, held["area"]))


def rows_of(counts, keys):
    """{number: [the counts of `keys`]}, or None for a municipality with one of them missing.

    `keys` are the codes after the number, one tuple per count.
    """
    rows = {}
    for number in {key[0] for key in counts}:
        row = [counts[(number, *key)] for key in keys]
        rows[number] = None if None in row else row
    return rows


def jobs(data, people):
    print("Jobs by sector (BFS, STATENT), employed persons at the end of each year:")
    years = [str(year) for year in range(2011, 2025)]
    names = [px_query(data, JOBS, f"jobs_{part[0]}", [
        item("Jahr", part), everything("Gemeinde"), everything("Wirtschaftssektor"),
        item("Beobachtungseinheit", ["2"])]) for part in (years[:7], years[7:])]
    held, missing = counts_of(data, names, "Gemeinde", JOBS)
    counts = {(n, year, sector): v for (n, year, sector, _), v in held.items()}
    withheld = {}
    for number, year, sector, _ in missing:
        withheld[sector] = withheld.get(sector, 0) + 1
    print(f"  years: {years[0]} to {years[-1]}; cells withheld: all sectors {withheld.get('999', 0)}, "
          f"primary {withheld.get('1', 0)}, secondary {withheld.get('2', 0)}, tertiary "
          f"{withheld.get('3', 0)}; municipalities with one in 2024: "
          f"{len({n for n, year, _, _ in missing if year == '2024'})}")
    places = {(n, year) for n, year, _, _ in missing}
    sectors_at_once = {}
    for place in places:
        at_once = sum((*place, sector, "2") in missing for sector in ("1", "2", "3"))
        sectors_at_once[at_once] = sectors_at_once.get(at_once, 0) + 1
    all_jobs = sorted(counts[(*place, "999")] for place in places
                      if counts[(*place, "999")] is not None)
    print(f"  municipality-years with a cell withheld: {len(places):,} of "
          f"{len({(n, year) for n, year, _ in counts}):,}; by the number of sectors withheld at "
          f"once: {dict(sorted(sectors_at_once.items()))}; their number of all jobs: median "
          f"{statistics.median(all_jobs):.0f}, most {all_jobs[-1]:,}")
    whole = [(n, year) for n, year in {(n, year) for n, year, _ in counts}
             if None not in [counts[(n, year, s)] for s in ("999", "1", "2", "3")]]
    print(f"  municipality-years with all four counts: {len(whole):,}; of them, the sectors do "
          f"not add up to all jobs in "
          f"{sum(counts[(n, y, '999')] != sum(counts[(n, y, s)] for s in '123') for n, y in whole)}")
    for year in ("2012", "2024"):
        total = on_votes_list(data, JOBS, rows_of(counts, [(year, "999")]))
        print(f"  {year}, on the votes' list: without the number of jobs "
              f"{sum(row is None for row in total.values())}")
        spread(f"jobs per 100 inhabitants ({year})",
               {n: share(row[0], people[year][n]) if row else None for n, row in total.items()},
               unit="", digits=1)
        for sector, name in (("1", "primary"), ("2", "secondary"), ("3", "tertiary")):
            rows = on_votes_list(data, JOBS, rows_of(counts, [(year, sector), (year, "999")]))
            values = {n: share(row[0], row[1]) if row else None for n, row in rows.items()}
            spread(f"jobs in the {name} sector ({year})", values)
            if year == "2024":
                named(f"{name} (2024)", values)
        if year == "2024":
            named("jobs per 100 inhabitants (2024)",
                  {n: share(row[0], people[year][n]) if row else None
                   for n, row in total.items()}, unit="", digits=1)


def born_abroad(data, people):
    print("Inhabitants born abroad (BFS, STATPOP), permanent residents at the end of each year:")
    name = px_query(data, BIRTHPLACE, "birthplace", [
        item("Jahr", YEARS), everything(GEO), item("Bevölkerungstyp", ["1"]),
        item("Geburtsort", ["-99999", "2"]), item("Geschlecht", ["-99999"]),
        item("Zivilstand", ["-99999"])])
    held, _ = counts_of(data, [name], GEO, BIRTHPLACE)
    counts = {(n, year, place): v for (n, year, _, place, _, _), v in held.items()}
    unequal = 0
    for year in YEARS:
        rows = on_votes_list(data, BIRTHPLACE, rows_of(counts, [(year, "-99999")]))
        unequal += sum(row[0] != people[year][n] for n, row in rows.items())
    print(f"  its inhabitants against the site's data file, {YEARS[0]} to {YEARS[-1]}, on the "
          f"votes' list: {unequal} of {len(YEARS) * len(rows):,} differ")
    for year in (YEARS[0], YEARS[-1]):
        rows = on_votes_list(data, BIRTHPLACE, rows_of(counts, [(year, "2"), (year, "-99999")]))
        values = {n: share(row[0], row[1]) if row else None for n, row in rows.items()}
        spread(f"born abroad ({year})", values)
    named(f"born abroad ({YEARS[-1]})", values)


def turnout(data):
    print("Turnout at National Council elections (BFS):")
    years = ["2011", "2015", "2019", "2023"]
    name = px_query(data, TURNOUT, "turnout", [
        everything(GEO), item("Jahr", years), item("Ergebnisse", ["1", "2"])])
    held, missing = counts_of(data, [name], GEO, TURNOUT)
    counts = {(n, year, what): v for (n, year, what), v in held.items()}
    for year in years:
        rows = on_votes_list(data, TURNOUT, rows_of(counts, [(year, "2"), (year, "1")]),
                             skip_missing=True)
        values = {n: share(row[0], row[1]) if row else None for n, row in rows.items()}
        spread(f"voters among those entitled ({year})", values)
        print(f"    without a figure: {sorted(n for n, v in values.items() if v is None)}")
    named("turnout (2023)", values)


def farms(data, people, hectares):
    print("Farms and farmland (BFS, farm structure survey):")
    with open(os.path.join(data, "tables", f"{FARMS}.json"), encoding="utf-8") as file:
        year_variable = next(v for v in json.load(file)["variables"] if v["code"] == "Jahr")
    code = dict(zip(year_variable["valueTexts"], year_variable["values"]))
    asked = [code[year] for year in YEARS]
    names = [
        px_query(data, FARMS, "farms", [
            item("Beobachtungseinheit", ["0"]), everything(GEO),
            item("Betriebssystem", ["0", "1"]), item("Jahr", asked)]),
        px_query(data, FARMS, "farmland", [
            item("Beobachtungseinheit", ["10"]), everything(GEO),
            item("Betriebssystem", ["0", "1"]), item("Jahr", asked)]),
    ]
    held, _ = counts_of(data, names, GEO, FARMS)
    counts = {(n, year, unit, system): v for (n, unit, system, year), v in held.items()}
    differ = {}
    for (unit, system, _), value in counts_of.switzerland.items():
        if counts_of.sums.get((unit, system, _)) != value:
            differ[(unit, system)] = differ.get((unit, system), 0) + 1
    print(f"  sums that differ from Switzerland, by what is counted (0 farms, 10 farmland) and "
          f"of which farms (0 all, 1 organic): {differ}")
    numbers = {key[0] for key in counts}
    print("  municipality-years with more organic farms than farms: "
          f"{sum(counts[(n, y, '0', '1')] > counts[(n, y, '0', '0')] for n in numbers for y in asked)}"
          "; with more organic farmland than farmland: "
          f"{sum(counts[(n, y, '10', '1')] > counts[(n, y, '10', '0')] for n in numbers for y in asked)}")
    for year in (YEARS[0], YEARS[-1]):
        y = code[year]
        rows = on_votes_list(data, FARMS, rows_of(
            counts, [(y, "0", "0"), (y, "0", "1"), (y, "10", "0"), (y, "10", "1")]))
        per_people = {n: 1000 * row[0] / people[year][n] if row else None
                      for n, row in rows.items()}
        organic = {n: share(row[1], row[0]) if row else None for n, row in rows.items()}
        land = {n: share(row[2], hectares[n]) if row else None for n, row in rows.items()}
        organic_land = {n: share(row[3], row[2]) if row else None for n, row in rows.items()}
        spread(f"farms per 1,000 inhabitants ({year})", per_people, unit="", digits=1)
        spread(f"organic farms among the farms ({year})", organic)
        spread(f"farmland of the area ({year})", land)
        spread(f"organic farmland of the farmland ({year})", organic_land)
        print(f"    farmland with a fraction of a hectare: "
              f"{sum(row is not None and row[2] != int(row[2]) for row in rows.values())}; "
              f"farmland larger than the area: "
              f"{sum(v is not None and v > 100 for v in land.values())}")
    named(f"farms per 1,000 inhabitants ({YEARS[-1]})", per_people, unit="", digits=1)
    named(f"farmland of the area ({YEARS[-1]})", land)
    named(f"organic farmland of the farmland ({YEARS[-1]})", organic_land)


def housing_2000(data):
    print("Census of 2000, occupied dwellings by who lives in them, and buildings by kind:")
    rooms = [str(n) for n in range(1, 11)]
    names = [px_query(data, DWELLINGS_2000, f"dwellings_2000_{part[0]}", [
        everything("Gemeinde"), item("Anzahl Zimmer", part), everything("Bewohnertyp"),
        item("Jahr", ["2000"])]) for part in (rooms[:4], rooms[4:8], rooms[8:])]
    held, _ = counts_of(data, names, "Gemeinde", DWELLINGS_2000)
    dwellings = {}
    for (number, _, occupant, _), value in held.items():
        row = dwellings.setdefault(number, [0, 0])
        row[0] += value
        # Owners: of the flat, of the house alone, of the house with others.
        row[1] += value if occupant in ("3", "4", "5") else 0
    rows = on_votes_list(data, DWELLINGS_2000, dwellings)
    values = {n: share(row[1], row[0]) if row else None for n, row in rows.items()}
    spread("dwellings lived in by their owner", values)
    named("dwellings lived in by their owner", values)
    name = px_query(data, BUILDINGS_2000, "buildings_2000", [
        everything("Gemeinde"), everything("Gebäudekategorie"), everything("Bauperiode"),
        item("Jahr", ["2000"])])
    held, _ = counts_of(data, [name], "Gemeinde", BUILDINGS_2000)
    buildings = {}
    for (number, kind, _, _), value in held.items():
        row = buildings.setdefault(number, [0, 0])
        row[0] += value
        row[1] += value if kind == "EFH" else 0
    rows = on_votes_list(data, BUILDINGS_2000, buildings)
    values = {n: share(row[1], row[0]) if row else None for n, row in rows.items()}
    spread("single-family houses among the buildings with dwellings", values)
    named("single-family houses", values)


def main():
    data = data_dir()
    lists(data)
    people, hectares = site()
    jobs(data, people)
    born_abroad(data, people)
    turnout(data)
    farms(data, people, hectares)
    housing_2000(data)


if __name__ == "__main__":
    main()
