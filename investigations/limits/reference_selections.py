"""Found while proposing add-limits: the results of named selections, the figures the specs of the
limits cite.

Run as `python3 reference_selections.py` from any directory; standard library only, no download.
It reads the app's data files in `app/static/data/` (votes.json, votes/<id>.json,
municipalities.json, characteristics.json) and applies the rules of the selection as the
change add-limits proposes them, written here a second time, apart from the app:

- A characteristic's value is compared as the panel writes it: a whole number in units of its
  last written digit (hundredths of a percent, whole inhabitants, whole inhabitants per km²,
  hundredths of a km², thousandths of a head of cattle per inhabitant), rounded half away from
  zero from its counts.
- A limit is narrowed when its lower bound is above the smallest value of the characteristic or
  its upper bound below the largest, over the municipalities of the list with a figure. A
  municipality remains when, for every narrowed limit, it has a figure that lies within both
  bounds, bounds included.
- A municipality's entry remains when the municipality remains. The Swiss abroad of a canton
  remain when the switch counts them and at least one municipality's entry of that canton
  remains.
- The result follows the voting rules of the calculation (hard constraint 2).
"""

import json
import math
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "app", "static", "data")
HALF = {"OW", "NW", "BS", "BL", "AR", "AI"}


def load(*path):
    with open(os.path.join(ROOT, *path), encoding="utf-8") as file:
        return json.load(file)


VOTES = {vote["id"]: vote for vote in load("votes.json")["votes"]}
NAMES = {number: name for rows in load("municipalities.json")["municipalities"].values()
         for number, name in rows}
ABROAD = set(load("municipalities.json")["swissAbroad"].values())
CHARS = load("characteristics.json")
INDEX = {number: i for i, number in enumerate(CHARS["municipalities"])}


def written(part, whole, decimals):
    """part / whole as the panel writes it, in units of its last digit; None without a figure.
    A share in percent is written(100 * part, whole, 2)."""
    if whole == 0:
        return None
    return (2 * part * 10 ** decimals + whole) // (2 * whole)


def applying(day):
    election = max((e for e in CHARS["elections"] if e["day"] < day), key=lambda e: e["day"])
    years = CHARS["population"]["years"]
    population_year = max(y for y in years if y < int(day[:4]))
    cattle_year = max(y for y in CHARS["cattle"]["years"] if y in years and y < int(day[:4]))
    return election, population_year, cattle_year


def characteristics(day):
    """Per characteristic (name, decimals of its value), the value of each municipality."""
    election, population_year, cattle_year = applying(day)
    people = CHARS["population"]["counts"][CHARS["population"]["years"].index(population_year)]
    cattle = CHARS["cattle"]["counts"][CHARS["cattle"]["years"].index(cattle_year)]
    cattle_people = CHARS["population"]["counts"][CHARS["population"]["years"].index(cattle_year)]
    numbers = CHARS["municipalities"]
    table = {}
    table[("Einwohner", 0)] = [p[0] for p in people]
    table[("Ausländeranteil", 2)] = [written(100 * p[1], p[0], 2) for p in people]
    for k, name in enumerate(["0–17", "18–34", "35–49", "50–64", "65+"]):
        table[(name, 2)] = [written(100 * p[2 + k], p[0], 2) for p in people]
    table[("Einwohner je km²", 0)] = [written(100 * p[0], a, 0) for p, a in zip(people, CHARS["area"])]
    for k, name in enumerate(["FDP", "Die Mitte", "SP", "SVP", "GLP", "Grüne", "Übrige"]):
        table[(name, 2)] = [None if v is None else written(100 * v[k], sum(v), 2) for v in election["votes"]]
    for k, name in enumerate(["Deutsch", "Französisch", "Italienisch", "Rätoromanisch"]):
        table[(name, 2)] = [written(100 * l[1 + k], l[0], 2) for l in CHARS["languages2000"]]
    table[("Fläche", 2)] = [written(a, 100, 2) for a in CHARS["area"]]
    table[("Rinder je Einwohner", 3)] = [written(c, p[0], 3) for c, p in zip(cattle, cattle_people)]
    assert all(len(values) == len(numbers) for values in table.values())
    return table


def ends(values):
    present = [v for v in values if v is not None]
    return min(present), max(present)


STEPS = 1000
LOGARITHMIC = {"Einwohner", "Einwohner je km²", "Fläche", "Rinder je Einwohner"}


def at(key, values, step):
    """The value of a track at a step from 0 to STEPS, rounded half up to a whole number of the
    characteristic's units. Linear: equal differences from the smallest value to the largest.
    Logarithmic: equal factors; when the smallest value is 0, step 0 is 0 and the steps from 1
    run from the smallest value above zero."""
    smallest, largest = ends(values)
    if key[0] not in LOGARITHMIC:
        return (2 * (smallest * STEPS + (largest - smallest) * step) + STEPS) // (2 * STEPS)
    if smallest > 0:
        return math.floor(smallest * (largest / smallest) ** (step / STEPS) + 0.5)
    if step == 0:
        return 0
    above = min(v for v in values if v is not None and v > 0)
    return math.floor(above * (largest / above) ** ((step - 1) / (STEPS - 1)) + 0.5)


def step_up_to(key, values, bound):
    """The last step whose value is at most `bound`."""
    return max(s for s in range(STEPS + 1) if at(key, values, s) <= bound)


def step_from(key, values, bound):
    """The first step whose value is at least `bound`."""
    return min(s for s in range(STEPS + 1) if at(key, values, s) >= bound)


def remaining(table, limits):
    """The municipalities that remain under the limits {(name, decimals): (lower, upper)}."""
    keep = set(CHARS["municipalities"])
    for key, (lower, upper) in limits.items():
        smallest, largest = ends(table[key])
        if lower <= smallest and upper >= largest:
            continue
        keep = {n for n in keep
                if table[key][INDEX[n]] is not None and lower <= table[key][INDEX[n]] <= upper}
    return keep


def result(vote_id, keep, abroad_counted):
    entries = load("votes", f"{vote_id}.json")["entries"]
    rows = []
    for canton, lines in entries.items():
        own = [line for line in lines if line[0] not in ABROAD and line[0] in keep]
        rows += [(canton, line) for line in own]
        if abroad_counted and own:
            rows += [(canton, line) for line in lines if line[0] in ABROAD]
    yes = sum(line[4] for _, line in rows)
    no = sum(line[5] for _, line in rows)
    cantons = {}
    for canton, line in rows:
        pair = cantons.setdefault(canton, [0, 0])
        pair[0] += line[4]
        pair[1] += line[5]
    weight = lambda canton: 0.5 if canton in HALF else 1
    in_favour = sum(weight(c) for c, (y, n) in cantons.items() if y > n)
    against = sum(weight(c) for c, (y, n) in cantons.items() if not y > n)
    municipalities = sum(1 for _, line in rows if line[0] not in ABROAD)
    abroad = sorted(c for c, line in rows if line[0] in ABROAD)
    return yes, no, in_favour, against, sorted(cantons), municipalities, abroad


def cantonal(value):
    return f"{int(value)}½" if value % 1 else f"{int(value)}"


def report(label, vote_id, keep, abroad_counted):
    vote = VOTES[vote_id]
    yes, no, in_favour, against, cantons, municipalities, abroad = result(vote_id, keep, abroad_counted)
    with_result = sum(1 for lines in load("votes", f"{vote_id}.json")["entries"].values()
                      for line in lines if line[0] not in ABROAD)
    share = "none" if yes + no == 0 else f"{100 * yes / (yes + no):.4f}%"
    needs_cantons = vote["kind"] != "optional-referendum"
    passed = yes > no and (in_favour > against or not needs_cantons)
    print(f"{label}")
    print(f"  vote {vote_id} of {vote['date']} ({vote['kind']}): municipalities remaining "
          f"{municipalities} of {with_result} with a result of their own; Swiss abroad of "
          f"{', '.join(abroad) or 'no canton'}")
    print(f"  yes {yes:,}, no {no:,}, yes share {share}, cantonal votes {cantonal(in_favour)} : "
          f"{cantonal(against)} ({len(cantons)} cantons), {'passed' if passed else 'failed'}")


def overview():
    """Over every judged vote: the Swiss abroad's share of the valid votes and the verdicts that
    differ without them; and the votes in which a municipality with a result has no party figure."""
    shares, flips, without_party = [], [], []
    everything = set(CHARS["municipalities"])
    for vote_id, vote in sorted(VOTES.items()):
        if vote["kind"] == "tie-break-question":
            continue
        counted = result(vote_id, everything, True)
        alone = result(vote_id, everything, False)
        shares.append(1 - (alone[0] + alone[1]) / (counted[0] + counted[1]))
        needs_cantons = vote["kind"] != "optional-referendum"
        verdict = lambda r: r[0] > r[1] and (r[2] > r[3] or not needs_cantons)
        if verdict(counted) != verdict(alone):
            flips.append(f"{vote_id} of {vote['date']} ({vote['kind']})")
        election, _, _ = applying(vote["date"])
        file = load("votes", f"{vote_id}.json")
        with_result = {line[0] for lines in file["entries"].values() for line in lines}
        lacking = sorted(n for n, votes in zip(CHARS["municipalities"], election["votes"])
                         if votes is None and n in with_result)
        if lacking:
            without_party.append((vote_id, vote["date"], election["year"], lacking))
    print(f"0. Over the {len(shares)} judged votes: the Swiss abroad hold {100 * min(shares):.2f}% "
          f"to {100 * max(shares):.2f}% of the valid votes; the verdict differs without them for "
          f"{', '.join(flips) or 'no vote'}.")
    print(f"   Votes in which a municipality with a result of its own has no party figure: "
          f"{len(without_party)}; the municipalities: "
          f"{sorted({(n, NAMES[n], year) for _, _, year, ns in without_party for n in ns})}")
    print(f"   Without a figure apart from the parties: "
          f"{sum(1 for p in CHARS['population']['counts'] for q in p if q[0] == 0)} "
          f"municipality-years with no inhabitants, "
          f"{sum(1 for l in CHARS['languages2000'] if l[0] == 0)} without inhabitants in 2000.")


def main():
    everything = set(CHARS["municipalities"])
    overview()
    print("1. With every limit at its full range and the Swiss abroad counted:")
    report("   the official result", 5950, everything, True)
    print("2. The Swiss abroad not counted, no limit narrowed:")
    report("   2015-06-14", 5950, everything, False)

    table = characteristics(VOTES[5960]["date"])
    print("3. Selections of the vote of 2016-02-28, each bound set by a step of its track of "
          f"{STEPS}, Swiss abroad counted:")
    foreigners = ("Ausländeranteil", 2)
    step = step_up_to(foreigners, table[foreigners], 2000)
    upper = at(foreigners, table[foreigners], step)
    keep = remaining(table, {foreigners: (ends(table[foreigners])[0], upper)})
    report(f"   a. Ausländeranteil (end of 2015), upper bound at step {step}: {upper}", 5960, keep, True)
    italian = ("Italienisch", 2)
    step = step_from(italian, table[italian], 5000)
    lower = at(italian, table[italian], step)
    keep = remaining(table, {italian: (lower, ends(table[italian])[1])})
    report(f"   b. Italienisch (census 2000), lower bound at step {step}: {lower}", 5960, keep, True)
    print("      cantons of the municipalities that remain:",
          sorted({c for c, lines in load("votes", "5960.json")["entries"].items()
                  for line in lines if line[0] in keep}))
    inhabitants = ("Einwohner", 0)
    lower = at(inhabitants, table[inhabitants], 500)
    keep = remaining(table, {inhabitants: (lower, ends(table[inhabitants])[1])})
    report(f"   c. Einwohner (end of 2015), lower bound at step 500: {lower}", 5960, keep, True)

    print("4. A municipality with a result and no party figure, vote 6400 of 2021-03-07:")
    table = characteristics(VOTES[6400]["date"])
    svp = ("SVP", 2)
    smallest, largest = ends(table[svp])
    entries = load("votes", "6400.json")["entries"]
    line = next(line for line in entries["BE"] if line[0] == 422)
    print(f"  422 {NAMES[422]}: entry with {line[4]} yes and {line[5]} no votes; SVP "
          f"{table[svp][INDEX[422]]}; the SVP track runs from {smallest} to {largest} hundredths")
    for step in (STEPS, STEPS - 1, step_up_to(svp, table[svp], 5000)):
        upper = at(svp, table[svp], step)
        keep = remaining(table, {svp: (smallest, upper)})
        print(f"  SVP upper bound at step {step}, {upper}: 422 "
              f"{'remains' if 422 in keep else 'is set aside'}; "
              f"{len(keep)} of {len(everything)} municipalities of the list remain")
    upper = at(svp, table[svp], step_up_to(svp, table[svp], 5000))
    report(f"   SVP (election 2019) up to {upper}", 6400, remaining(table, {svp: (smallest, upper)}), True)

    print("5. The ends of each track for the vote of 2016-02-28 (units of the last written digit), "
          "and the value at the middle step (500):")
    table = characteristics(VOTES[5960]["date"])
    for key, values in table.items():
        smallest, largest = ends(values)
        zeros = sum(1 for v in values if v == 0)
        above = min(v for v in values if v is not None and v > 0)
        missing = sum(1 for v in values if v is None)
        scale = "log" if key[0] in LOGARITHMIC else "linear"
        print(f"  {key[0]:<20} {smallest:>6} to {largest:>6}, {scale:<6} middle {at(key, values, 500):>6}, "
              f"step 1 {at(key, values, 1):>5}; zero {zeros}, smallest above zero {above}, "
              f"without a figure {missing}")

main()
