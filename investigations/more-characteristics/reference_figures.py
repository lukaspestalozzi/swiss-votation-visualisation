"""The figures the specs cite: the 14 characteristics Q chose for `add-more-characteristics`, for
named municipalities and the vote of 2016-02-28, whose figures are those of 2015; the newest
figures; and the municipalities without one.

It reads what `census_2000.py` and `candidate_tables.py` downloaded, and the inhabitants from the
site's data file. A share is written with two decimals and a number per inhabitants with one,
each rounded half away from zero from the counts, as the site writes its values. Standard
library only.

    python3 reference_figures.py /path/outside/the/repository
"""

import contextlib
import io
import json
import os
import sys
from decimal import ROUND_HALF_UP, Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import candidate_tables as tables  # noqa: E402
import census_2000 as census  # noqa: E402
from figures import GEO, VOTES_LIST, data_dir, onto_votes_list, register, successors  # noqa: E402

NAMED = [261, 6621, 6172, 6084, 5192]
# Municipalities without one of the figures: Oberrieden, Meienried, Rue (made of four), Linescio.
WITHOUT = [137, 389, 2097, 5315]


def written(part, whole, digits, unit=""):
    if part is None or not whole:
        return "none"
    value = (Decimal(part) / Decimal(whole)).quantize(Decimal(1).scaleb(-digits), ROUND_HALF_UP)
    return f"{value}{unit}"


def percent(part, whole):
    return written(None if part is None else 100 * part, whole, 2, "%")


def quiet(function, *arguments):
    with contextlib.redirect_stdout(io.StringIO()):
        return function(*arguments)


def main():
    data = data_dir()
    names = register(data, VOTES_LIST)
    people, _ = tables.site()

    religion, codes, _ = quiet(census.per_municipality, data, "religion_2000", "Religion")
    wanted = ["0", census.REFORMED, census.CATHOLIC, census.NONE]
    religion, _ = onto_votes_list(
        {n: [row[c] for c in wanted] for n, row in religion.items()}, data, census.LIST)
    education, codes, _ = quiet(census.per_municipality, data, "education_2000",
                                "Höchste abgeschlossene Ausbildung")
    levels = [census.LEVELS[name] for name in
              ("none or compulsory school", "upper secondary", "tertiary")]
    education, _ = onto_votes_list(
        {n: [sum(row[c] for c in level) for level in levels] for n, row in education.items()},
        data, census.LIST)
    rooms = ["1", "5", "9"]
    held, _ = quiet(tables.counts_of, data, [f"dwellings_2000_{r}.json" for r in rooms],
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

    held, _ = quiet(tables.counts_of, data, ["birthplace.json"], GEO, tables.BIRTHPLACE)
    born = {(n, year, place): v for (n, year, _, place, _, _), v in held.items()}
    held, _ = quiet(tables.counts_of, data, ["jobs_2011.json", "jobs_2018.json"], "Gemeinde",
                    tables.JOBS)
    jobs = {(n, year, sector): v for (n, year, sector, _), v in held.items()}
    held, _ = quiet(tables.counts_of, data, ["farms.json", "farmland.json"], GEO, tables.FARMS)
    farms = {(n, year, unit, system): v for (n, unit, system, year), v in held.items()}
    with open(os.path.join(data, "tables", f"{tables.FARMS}.json"), encoding="utf-8") as file:
        variable = next(v for v in json.load(file)["variables"] if v["code"] == "Jahr")
    farm_year = dict(zip(variable["valueTexts"], variable["values"]))

    def of_year(year):
        """Per municipality of the votes' list, the yearly counts of `year`."""
        abroad = tables.on_votes_list(data, tables.BIRTHPLACE, tables.rows_of(
            born, [(year, "2"), (year, "-99999")]))
        sectors = [tables.on_votes_list(data, tables.JOBS, tables.rows_of(jobs, [(year, s)]))
                   for s in ("999", "1", "2", "3")] if (261, year, "999") in jobs else None
        y = farm_year[year]
        farm = tables.on_votes_list(data, tables.FARMS, tables.rows_of(
            farms, [(y, "0", "0"), (y, "10", "0"), (y, "10", "1")]))
        return abroad, sectors, farm

    print("The census of 2000 (religion: all, Evangelical Reformed, Roman Catholic, no "
          "affiliation; education: none or compulsory school, upper secondary, tertiary; "
          "dwellings: occupied, by their owner; buildings: with dwellings, single-family):")
    for n in NAMED:
        r, e, d, b = religion[n], education[n], dwellings[n], buildings[n]
        print(f"  {names[n]} ({n}): religion {r}: {percent(r[1], r[0])}, {percent(r[2], r[0])}, "
              f"{percent(r[3], r[0])}; education {e}: tertiary {percent(e[2], sum(e))}, none or "
              f"compulsory {percent(e[0], sum(e))}; dwellings {d}: {percent(d[1], d[0])}; "
              f"buildings {b}: {percent(b[1], b[0])}")

    for year in ("2015", "2024", "2025"):
        abroad, sectors, farm = of_year(year)
        print(f"The figures of {year}:")
        for n in [*NAMED, *WITHOUT]:
            line = (f"  {names[n]} ({n}): inhabitants {people[year][n]:,}; born abroad "
                    f"{abroad[n][0]:,} of {abroad[n][1]:,}: {percent(*abroad[n])}")
            if sectors is None:
                line += "; jobs: the table has no figures of this year"
            else:
                all_, first, second, third = (rows[n][0] if rows[n] else None for rows in sectors)
                line += (f"; jobs {all_}, by sector {first}, {second}, {third}: "
                         f"{written(None if all_ is None else 100 * all_, people[year][n], 1)} "
                         f"per 100 inhabitants, {percent(first, all_)}, {percent(second, all_)}, "
                         f"{percent(third, all_)}")
            f = farm[n]
            line += (f"; farms {f[0]}, farmland {f[1]} ha, organic {f[2]} ha: "
                     f"{written(1000 * f[0], people[year][n], 1)} per 1,000 inhabitants, organic "
                     f"{percent(f[2], f[1])}")
            print(line)
        if year == "2015":
            earlier = register(data, tables.LIST[tables.JOBS])
            parts = [n for n, later in successors(data, tables.LIST[tables.JOBS]).items()
                     if 2097 in later]
            print("  the parts of Rue (2097) on the jobs table's list, their jobs (all, primary, "
                  "secondary, tertiary): " + "; ".join(
                      f"{earlier[n]} {[jobs[(n, year, s)] for s in ('999', '1', '2', '3')]}"
                      for n in parts))
        if sectors is not None:
            for index, name in enumerate(("all sectors", "primary", "secondary", "tertiary")):
                without = sorted(n for n, row in sectors[index].items() if row is None)
                print(f"  jobs, {name}: {len(without)} municipalities without a count"
                      + (f", the first {[(n, names[n]) for n in without[:3]]}" if without else ""))
            no_jobs = sorted(n for n, row in sectors[0].items() if row and row[0] == 0)
            print(f"  municipalities with no job: {[(n, names[n]) for n in no_jobs]}")
        no_farm = sorted(n for n, f in farm.items() if f[0] == 0)
        no_land = sorted(n for n, f in farm.items() if f[1] == 0)
        print(f"  without a farm: {len(no_farm)}; without farmland: {len(no_land)}, the first "
              f"{[(n, names[n]) for n in no_land[:3]]}; organic farmland larger than the "
              f"farmland: {sum(f[2] > f[1] for f in farm.values())}")
        ends = {
            "born abroad": [100 * a[0] / a[1] for a in abroad.values()],
            "farms per 1,000 inhabitants": [1000 * f[0] / people[year][n]
                                            for n, f in farm.items()],
        }
        if sectors is not None:
            ends["jobs per 100 inhabitants"] = [
                100 * row[0] / people[year][n] for n, row in sectors[0].items() if row]
        print("  from the least to the most: " + "; ".join(
            f"{name} {min(values):.2f} to {max(values):.2f}" for name, values in ends.items()))


if __name__ == "__main__":
    main()
