"""Three facts found while proposing add-vote-data: ids, registered voters, changes of canton.

Run as `python3 check_ids_and_cantons.py <data directory>`. It downloads what is not there yet:
the vote-day files of the BFS, the Federal Chancellery's national rows with the BFS's id, and
four snapshots of the register around the two changes of canton since 2013.
"""

import collections
import csv
import os
import urllib.parse

from sources import FEED, HALF_VOTE, REGISTER, SINCE, SPARQL, data_dir, fetch, load_json

QUERY = """
PREFIX cube: <https://cube.link/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX vote: <https://politics.ld.admin.ch/political-rights/popular-vote/>
SELECT ?date ?id ?yes ?no ?registered ?cast WHERE {
  ?obs a cube:Observation ; vote:date ?date ; vote:id ?id .
  OPTIONAL { ?obs vote:region ?region . }
  FILTER(!BOUND(?region) || ?region = <https://ld.admin.ch/country/CHE>)
  OPTIONAL { ?obs vote:ja ?yes ; vote:nein ?no ; vote:stimmberechtigte ?registered ;
             vote:eingereicht ?cast . }
  FILTER(?date >= "%s"^^xsd:date)
} ORDER BY ?date ?id
""" % SINCE
CANTONS = "ZH BE LU UR SZ OW NW GL ZG FR SO BS BL SH AR AI SG GR AG TG TI VD VS NE GE JU".split()
COUNTS = ("anzahlStimmberechtigte", "eingelegteStimmzettel", "gueltigeStimmen",
          "jaStimmenAbsolut", "neinStimmenAbsolut")
# Snapshots before and after the two changes of canton since 2013.
SNAPSHOTS = ["2021-12-31", "2022-01-01", "2025-12-31", "2026-01-01"]
NAMES = ("Moutier", "Clavaleyres", "Murten")

data = data_dir()
path = lambda name: os.path.join(data, name)

fetch(SPARQL, path("chancellery_ids.json"),
      body=urllib.parse.urlencode({"query": QUERY}).encode(),
      headers={"Accept": "application/sparql-results+json",
               "Content-Type": "application/x-www-form-urlencoded"})
# The Chancellery writes "" for a figure it does not give yet.
value = lambda row, key: row[key]["value"] or None if key in row else None
rows = load_json(data, "chancellery_ids.json")["results"]["bindings"]
by_id = collections.defaultdict(list)
for row in rows:
    by_id[int(value(row, "id"))].append(row)

# The vote days are the Chancellery's; a day without a BFS file (one still to come) is skipped.
votes = []
for day in sorted({value(row, "date").replace("-", "") for row in rows}):
    if fetch(FEED.format(day=day), path(f"feed_{day}.json")):
        for v in load_json(data, f"feed_{day}.json")["schweiz"].get("vorlagen") or []:
            if v["resultat"]["jaStimmenAbsolut"] is not None:
                votes.append(dict(v, day=f"{day[:4]}-{day[4:6]}-{day[6:]}"))

# 1. The Chancellery's rows carry the BFS's id.
matched = [v for v in votes if len(by_id[v["vorlagenId"]]) == 1]
print(f"BFS votes with a result: {len(votes)}; with exactly one row of the Chancellery "
      f"with the same id: {len(matched)}")

# 2. Registered voters and ballots cast, where the Chancellery gives figures.
validated = [v for v in matched if value(by_id[v["vorlagenId"]][0], "yes") is not None]
differ = lambda key, count: [v for v in validated if int(value(by_id[v["vorlagenId"]][0], key))
                             != v["resultat"][count]]
print(f"validated: {len(validated)}; yes and no identical: "
      f"{len(validated) - len(differ('yes', 'jaStimmenAbsolut') + differ('no', 'neinStimmenAbsolut'))}")
for key, count, label in (("registered", "anzahlStimmberechtigte", "registered voters"),
                          ("cast", "eingelegteStimmzettel", "ballots cast")):
    gaps = [abs(int(value(by_id[v["vorlagenId"]][0], key)) - v["resultat"][count])
            for v in differ(key, count)]
    print(f"  {label} differ in {len(gaps)}, by {min(gaps):,} to {max(gaps):,}")

# 3. The entries of a canton against the canton's figures, and the entry that explains it.
print("\ncantons whose entries do not sum to the canton's figures in the BFS file:")
periods = collections.defaultdict(list)
for v in votes:
    for canton in v["kantone"]:
        entries = canton["gemeinden"]
        gap = tuple(sum(g["resultat"][c] for g in entries) - canton["resultat"][c] for c in COUNTS)
        if any(gap):
            places = [g for c in v["kantone"] for g in c["gemeinden"]
                      if tuple(g["resultat"][k] for k in COUNTS) == tuple(abs(x) for x in gap)]
            explained = ", ".join(f"{g['geoLevelnummer']} {g['geoLevelname']}" for g in places)
            sign = "more" if gap[0] > 0 else "fewer"
            periods[(CANTONS[int(canton["geoLevelnummer"]) - 1], sign, explained)].append(v)
for (canton, sign, explained), group in sorted(periods.items()):
    days = sorted({v["day"] for v in group})
    print(f"  {canton}: the entries have {sign} than the canton in {len(group)} votes on "
          f"{len(days)} vote days, {days[0]} to {days[-1]}; the difference is exactly "
          f"the entry {explained or 'of none'}")

# For which canton Moutier is counted: does a cantonal vote change?
days, flips, closest = set(), 0, []
for v in votes:
    cantons = {CANTONS[int(c["geoLevelnummer"]) - 1]: c for c in v["kantone"]}
    moutier = [g for g in cantons["JU"]["gemeinden"] if g["geoLevelnummer"] == "6831"]
    if not moutier or cantons["JU"]["resultat"]["jaStimmenAbsolut"] == sum(
            g["resultat"]["jaStimmenAbsolut"] for g in cantons["JU"]["gemeinden"]):
        continue
    days.add(v["day"])
    m = moutier[0]["resultat"]
    for canton, sign in (("BE", -1), ("JU", +1)):
        yes, no = cantons[canton]["resultat"]["jaStimmenAbsolut"], cantons[canton]["resultat"]["neinStimmenAbsolut"]
        other = (yes + sign * m["jaStimmenAbsolut"], no + sign * m["neinStimmenAbsolut"])
        flips += (yes > no) != (other[0] > other[1])
        closest.append((abs(other[0] - other[1]), canton, v["day"], v["vorlagenId"]))
print(f"Moutier counted for the other canton: {len(days)} vote days, "
      f"{min(days)} to {max(days)}; cantons whose outcome changes: {flips}")
margin, canton, day, vote = min(closest)
print(f"  closest, with Moutier counted for the other canton: {canton} on {day}, vote {vote}, "
      f"decided by {margin} votes (cantonal votes {0.5 if canton in HALF_VOTE else 1})")

# The two changes of canton, as the register's snapshots show them.
print("\nregister snapshots:")
for date in SNAPSHOTS:
    year, month, day = date.split("-")
    name = f"register_{date}.csv"
    fetch(REGISTER.format(date=f"{day}-{month}-{year}"), path(name),
          is_complete=lambda content: content.decode("utf-8-sig"))
    with open(path(name), encoding="utf-8-sig") as file:
        records = list(csv.DictReader(file))
    level = lambda n: {r["HistoricalCode"]: r for r in records if r["Level"] == n}
    districts, cantons = level("2"), level("1")
    found = [f"{r['Name']} {r['BfsCode']} {cantons[districts[r['Parent']]['Parent']]['ShortName']}"
             for r in records if r["Level"] == "3" and r["Name"] in NAMES]
    print(f"  {date}: {', '.join(sorted(found))}")
