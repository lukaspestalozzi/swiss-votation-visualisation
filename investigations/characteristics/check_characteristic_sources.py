"""Found while proposing add-characteristics: the sources of the characteristics, the list of
municipalities each of them uses, what they lack, and how they come onto the votes' list.

Run as `uv run --no-project --with pyshp==3.1.6 python check_characteristic_sources.py <data
directory>`; see figures.py.
"""

import gzip
import json
from collections import Counter, defaultdict

from figures import (
    CENSUS_2000, ELECTION_YEARS, ELECTIONS, FARMS, FIRST_SPECIAL_CODE, GEO, LANGUAGES, LIST_DATE,
    POPULATION, VOTES_LIST, YEARS, AGE_GROUPS, areas, party_groups, cube, data_dir, download, load_json,
    municipality, onto_votes_list, register, successors,
)

data = data_dir()
download(data)
today = register(data, VOTES_LIST)


def geo_codes(labels, dimension):
    """{code: number} of the municipalities of a table's geographic dimension, in its order."""
    return {code: municipality(code, label) for code, label in labels[dimension].items()
            if municipality(code, label) is not None}


def compare_list(name, table, numbers):
    special = {n for n in numbers if n >= FIRST_SPECIAL_CODE}
    numbers = set(numbers) - special
    date = LIST_DATE[table]
    listed = set(register(data, date))
    print(f"  its municipalities: {len(numbers)} (and {len(special)} codes from "
          f"{FIRST_SPECIAL_CODE} on, which are no municipality); against the register of {date}: "
          f"{len(numbers - listed)} not in it, {len(listed - numbers)} of it missing")
    return numbers


print("Population (BFS, STATPOP):", load_json(data, f"meta_{POPULATION}.json")["title"])
dims, totals, labels, symbols = cube(data, "population_totals.json")
codes = geo_codes(labels, GEO)
numbers = compare_list("population", POPULATION, codes.values())
print(f"  years read: {YEARS[0]} to {YEARS[-1]}; values missing: {len(symbols)}")
population = {}  # (year, number): [total, foreign, five age groups]
for year in YEARS:
    swiss = totals[(year, "8100", "1", "-99999", "-99999", "-99999")]
    swiss_foreign = totals[(year, "8100", "1", "2", "-99999", "-99999")]
    total = sum(totals[(year, c, "1", "-99999", "-99999", "-99999")] for c in codes)
    foreign = sum(totals[(year, c, "1", "2", "-99999", "-99999")] for c in codes)
    ages = defaultdict(int)
    missing = 0
    for first in (0, 34, 67):
        _, values, _, absent = cube(data, f"population_ages_{year}_{first}.json")
        missing += len(absent)
        for (_, code, _, _, _, age), value in values.items():
            if code in codes:
                group = next(i for i, (a, b) in enumerate(AGE_GROUPS) if a <= int(age) <= b)
                ages[(code, group)] += value
    unequal = [c for c in codes
               if sum(ages[(c, g)] for g in range(5)) != totals[(year, c, "1", "-99999", "-99999", "-99999")]]
    for code, number in codes.items():
        population[(year, number)] = [totals[(year, code, "1", "-99999", "-99999", "-99999")],
                                      totals[(year, code, "1", "2", "-99999", "-99999")],
                                      *[ages[(code, g)] for g in range(5)]]
    print(f"  {year}: Switzerland {swiss:,}, the municipalities add up to {total:,}; foreigners "
          f"{swiss_foreign:,} and {foreign:,}; ages missing {missing}, municipalities whose ages "
          f"do not add up to the total: {len(unequal)}; smallest municipality "
          f"{min(population[(year, n)][0] for n in codes.values())}")

print()
print("National Council elections (BFS):", load_json(data, f"meta_{ELECTIONS}.json")["title"])
meta = load_json(data, f"meta_{ELECTIONS}.json")
parties = dict(zip(meta["variables"][2]["values"], meta["variables"][2]["valueTexts"]))
print("  parties:", ", ".join(f"{code} {name}" for code, name in parties.items()))
votes_by_party = {}
for year in ELECTION_YEARS:
    dims, values, labels, symbols = cube(data, f"party_votes_{year}.json")
    codes = geo_codes(labels, dims[0])
    if year == ELECTION_YEARS[0]:
        compare_list("elections", ELECTIONS, codes.values())
    signs = Counter(symbols.values())
    without = [labels[dims[0]][c].strip(".") for c, n in codes.items()
               if n < FIRST_SPECIAL_CODE and all(values[(c, year, p, "1")] is None for p in parties)]
    # The table lists each district before its municipalities: they must add up to it.
    district, sums, unequal = None, defaultdict(int), []
    for code in labels[dims[0]]:
        if code not in codes:
            district = code
            continue
        for p in parties:
            sums[(district, p)] += values[(code, year, p, "1")] or 0
    for (d, p), total in sums.items():
        if total != (values[(d, year, p, "1")] or 0):
            unequal.append((labels[dims[0]][d], parties[p]))
    for code, number in codes.items():
        if number < FIRST_SPECIAL_CODE:
            row = [values[(code, year, p, "1")] for p in parties]
            # "..." for a party in a municipality that has votes: the party had no list there.
            votes_by_party[(year, number)] = (None if all(v is None for v in row)
                                              else [v or 0 for v in row])
    print(f"  {year}: signs for missing values {dict(signs)}; municipalities without any party "
          f"votes: {len(without)} {without}; districts whose municipalities do not add up: "
          f"{unequal}")

print()
print("Farms (BFS):", load_json(data, f"meta_{FARMS}.json")["title"])
dims, values, labels, symbols = cube(data, "cattle.json")
codes = geo_codes(labels, GEO)
compare_list("farms", FARMS, codes.values())
year_of = dict(zip(load_json(data, f"meta_{FARMS}.json")["variables"][3]["values"],
                   load_json(data, f"meta_{FARMS}.json")["variables"][3]["valueTexts"]))
swiss_code = next(c for c, label in labels[GEO].items() if label == "Schweiz")
cattle = {}
for (unit, code, system, year), value in values.items():
    if code in codes:
        cattle[(year_of[year], codes[code])] = [value]
for year in YEARS:
    code_of_year = next(c for c, y in year_of.items() if y == year)
    total = sum(cattle[(year, n)][0] for n in codes.values())
    zero = sum(1 for n in codes.values() if cattle[(year, n)][0] == 0)
    print(f"  {year}: cattle in Switzerland {values[('15', swiss_code, '0', code_of_year)]:,}, "
          f"the municipalities add up to {total:,}; municipalities without cattle {zero}")
print(f"  values missing: {len(symbols)}")

print()
print("Census 2000 (BFS):", load_json(data, f"meta_{CENSUS_2000}.json")["title"])
dims, values, labels, symbols = cube(data, "languages_2000.json")
codes = geo_codes(labels, GEO)
compare_list("census", CENSUS_2000, codes.values())
swiss_code = next(c for c, label in labels[GEO].items() if label == "Schweiz")
languages = {}
for code, number in codes.items():
    languages[("2000", number)] = [values[("1", code, "0", lang)] for lang in ["0", *LANGUAGES]]
for i, name in enumerate(["all main languages", *LANGUAGES.values()]):
    total = sum(row[i] for row in languages.values())
    lang = ["0", *LANGUAGES][i]
    print(f"  {name}: Switzerland {values[('1', swiss_code, '0', lang)]:,}, the municipalities "
          f"add up to {total:,}")
print(f"  values missing: {len(symbols)}")

print()
print(f"Onto the votes' list of {VOTES_LIST} ({len(today)} municipalities), through the "
      "register's correspondences:")
sets = {"population": (POPULATION, population), "party votes": (ELECTIONS, votes_by_party),
        "cattle": (FARMS, cattle), "languages": (CENSUS_2000, languages)}
moved = {}
for name, (table, figures) in sets.items():
    date = LIST_DATE[table]
    after = successors(data, date)
    changed = {n: t for n, t in after.items() if t != {n}}
    several = {n: t for n, t in after.items() if len(t) > 1}
    print(f"  {name} ({date}): {len(changed)} numbers lead to another number, "
          f"{len(several)} to several: {several}")
    for year in sorted({y for y, _ in figures}):
        counts = {n: v for (y, n), v in figures.items() if y == year}
        summed, groups = onto_votes_list(counts, data, date)
        moved[(name, year)] = summed
        lacking = sorted(n for n in today if summed.get(n) is None)
        before = [sum(v[i] for v in counts.values() if v) for i in range(len(next(iter(counts.values()))))] \
            if name != "party votes" else None
        after_sum = [sum(v[i] for n, v in summed.items() if v and n in today
                         and min(groups[n]) == n) for i in range(len(before))] if before else None
        shared = sorted({tuple(sorted(g)) for g in groups.values() if len(g) > 1})
        print(f"    {year}: without figures {len(lacking)} {[today[n] for n in lacking]}"
              + (f"; sums kept: {before == after_sum}" if before else "")
              + (f"; groups: {shared}" if shared else ""))

print()
area = areas(data)
lakes = [n for n, (_, lake, _) in area.items() if lake > 0]
print(f"swissBOUNDARIES3D 2026-01: {len(area)} municipalities; against the list of {VOTES_LIST}: "
      f"{len(set(area) - set(today))} not in it, {len(set(today) - set(area))} missing; "
      f"{len(lakes)} with a part in a lake; total {sum(a for a, _, _ in area.values()):,} ha; "
      f"smallest {min((a, name) for a, _, name in area.values())}")

print()
prototype = {
    "population": {y: [moved[("population", y)][n] for n in sorted(today)] for y in YEARS},
    "partyVotes": {y: [None if moved[("party votes", y)][n] is None
                       else party_groups(list(parties), moved[("party votes", y)][n])
                       for n in sorted(today)] for y in ELECTION_YEARS},
    "cattle": {y: [moved[("cattle", y)][n][0] for n in sorted(today)] for y in YEARS},
    "languages2000": [moved[("languages", "2000")][n] for n in sorted(today)],
    "area": [area[n][0] for n in sorted(today)],
}
text = json.dumps(prototype, separators=(",", ":")).encode()
print(f"A file of these counts per municipality of the votes' list (the six named parties "
      f"and the others): "
      f"{len(text):,} bytes, {len(gzip.compress(text, 9)):,} compressed with gzip")
