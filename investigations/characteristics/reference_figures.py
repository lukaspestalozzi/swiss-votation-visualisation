"""Found while proposing add-characteristics: which figures apply to each vote day, and the
characteristics of the municipalities the specs name, for the vote of 2016-02-28 (id 5960).

Run as `uv run --no-project --with pyshp==3.1.6 python reference_figures.py <data directory>`
after check_characteristic_sources.py; see figures.py. It reads the vote days from the app's
data file `app/static/data/votes.json`.

The rule: a vote takes the population and the cattle at the end of the last year before its
day, the strengths of the parties of the last National Council election before its day, the
census of 2000 and the area of swissBOUNDARIES3D 2026-01. Each characteristic is computed
from counts that were first added up per municipality of the votes' list.
"""

import json
import os
from collections import defaultdict

from figures import (
    CENSUS_2000, ELECTION_DAYS, ELECTIONS, FARMS, FIRST_SPECIAL_CODE, GEO, LANGUAGES, LIST_DATE,
    PARTY_GROUPS, POPULATION, VOTES_LIST, AGE_GROUPS, areas, party_groups, cube, data_dir, load_json, municipality,
    onto_votes_list, register,
)

data = data_dir()
today = register(data, VOTES_LIST)
votes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                                    "app", "static", "data", "votes.json"), encoding="utf-8"))

print("Vote days and the figures that apply:")
by_years = defaultdict(list)
for day in sorted({vote["date"] for vote in votes["votes"]}):
    year = str(int(day[:4]) - 1)
    election = max(y for y, d in ELECTION_DAYS.items() if d < day)
    by_years[(year, election)].append(day)
for (year, election), days in by_years.items():
    print(f"  population and cattle {year}, election {election} ({ELECTION_DAYS[election]}): "
          f"{days[0]} to {days[-1]} ({len(days)} vote days)")



def codes_of(labels, dimension):
    return {code: municipality(code, label) for code, label in labels[dimension].items()
            if municipality(code, label) is not None
            and municipality(code, label) < FIRST_SPECIAL_CODE}


def onto_list(table, rows):
    summed, _ = onto_votes_list(rows, data, LIST_DATE[table])
    return summed


YEAR, ELECTION = "2015", "2015"  # the vote of 2016-02-28
dims, totals, labels, _ = cube(data, "population_totals.json")
codes = codes_of(labels, GEO)
ages = defaultdict(int)
for first in (0, 34, 67):
    _, values, _, _ = cube(data, f"population_ages_{YEAR}_{first}.json")
    for (_, code, _, _, _, age), value in values.items():
        if code in codes:
            ages[(code, next(i for i, (a, b) in enumerate(AGE_GROUPS) if a <= int(age) <= b))] += value
population = onto_list(POPULATION, {
    n: [totals[(YEAR, c, "1", "-99999", "-99999", "-99999")],
        totals[(YEAR, c, "1", "2", "-99999", "-99999")],
        *[ages[(c, g)] for g in range(5)]] for c, n in codes.items()})

dims, values, labels, _ = cube(data, f"party_votes_{ELECTION}.json")
parties = list(labels[dims[2]])
codes = codes_of(labels, dims[0])
party_rows = {}
for code, number in codes.items():
    row = [values[(code, ELECTION, p, "1")] for p in parties]
    party_rows[number] = None if all(v is None for v in row) else [v or 0 for v in row]
party_votes = onto_list(ELECTIONS, party_rows)

dims, values, labels, _ = cube(data, "cattle.json")
meta = load_json(data, f"meta_{FARMS}.json")
year_code = dict(zip(meta["variables"][3]["valueTexts"], meta["variables"][3]["values"]))[YEAR]
codes = codes_of(labels, GEO)
cattle = onto_list(FARMS, {n: [values[("15", c, "0", year_code)]] for c, n in codes.items()})

dims, values, labels, _ = cube(data, "languages_2000.json")
codes = codes_of(labels, GEO)
languages = onto_list(CENSUS_2000, {n: [values[("1", c, "0", lang)] for lang in ["0", *LANGUAGES]]
                                    for c, n in codes.items()})
area = areas(data)

print()
print(f"The characteristics for the vote of 2016-02-28 (population and cattle {YEAR}, election "
      f"{ELECTION}, census 2000, area 2026), per municipality of the list of {VOTES_LIST}:")
for number in [261, 351, 389, 2056, 6831, 5249, 5269]:
    total, foreign, *groups = population[number]
    hectares = area[number][0]
    print(f"  {number} {today[number]}: inhabitants {total:,}; foreigners {foreign:,} "
          f"({100 * foreign / total:.4f}%)")
    print("    ages " + ", ".join(f"{a}-{b if b < 100 else ''}: {g:,} ({100 * g / total:.4f}%)"
                                  for (a, b), g in zip(AGE_GROUPS, groups)))
    print(f"    area {hectares:,} ha = {hectares / 100} km2 (lake part {area[number][1]} ha); "
          f"inhabitants per km2 {total / (hectares / 100):.4f}")
    print(f"    cattle {cattle[number][0]:,}, per inhabitant {cattle[number][0] / total:.6f}")
    row = party_votes[number]
    if row is None:
        print("    party votes: none")
    else:
        all_votes = sum(row)
        named = dict(zip([*PARTY_GROUPS, "Übrige"], party_groups(parties, row)))
        print(f"    party votes {all_votes:,}: " + ", ".join(
            f"{name} {v:,} ({100 * v / all_votes:.4f}%)" for name, v in named.items()))
    main, *spoken = languages[number]
    print(f"    census 2000, main language of {main:,}: " + ", ".join(
        f"{name} {v:,} ({100 * v / main:.4f}%)" for name, v in zip(LANGUAGES.values(), spoken)))
