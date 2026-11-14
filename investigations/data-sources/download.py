"""Download everything the checks read. Files that are there are kept, so it can be re-run.

The table of the BFS allows 50 calls in 15 seconds; with one call per vote this takes a while.
"""

import csv
import json
import os
import time
import urllib.parse

from sources import (CHARACTERISTICS, FEED, PX_META, REGISTER, REGISTER_DATES, SINCE, SPARQL,
                     SWISSVOTES, TABLE, data_dir, fetch, load_json)

CHANCELLERY_QUERY = """
PREFIX cube: <https://cube.link/>
PREFIX schema: <http://schema.org/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX vote: <https://politics.ld.admin.ch/political-rights/popular-vote/>
SELECT DISTINCT ?date ?number ?title ?type ?result ?detail ?yes ?no ?cy ?cn ?source ?note WHERE {
  ?obs a cube:Observation ; vote:date ?date ; vote:abstimmungsNummerBk ?number ;
       vote:abstimmungstitel ?t ; vote:typologie ?type ; vote:ergebnis ?result ;
       vote:ergebnisDetail ?detail .
  OPTIONAL { ?obs vote:region ?region . }
  FILTER(!BOUND(?region) || ?region = <https://ld.admin.ch/country/CHE>)
  ?t schema:name ?title . FILTER(LANGMATCHES(LANG(?title), "de"))
  OPTIONAL { ?obs vote:ja ?yes ; vote:nein ?no . }
  OPTIONAL { ?obs vote:staendeJaText ?cy ; vote:staendeNeinText ?cn . }
  OPTIONAL { ?obs vote:quelle ?s . ?s schema:name ?source . FILTER(LANGMATCHES(LANG(?source), "de")) }
  OPTIONAL { ?obs vote:anmerkung ?n . ?n schema:name ?note . FILTER(LANGMATCHES(LANG(?note), "de")) }
  FILTER(?date >= "%s"^^xsd:date)
} ORDER BY ?date ?number
""" % SINCE

data = data_dir()
path = lambda name: os.path.join(data, name)

fetch(TABLE, path("table_meta.json"))
fetch(SWISSVOTES, path("swissvotes_dataset.csv"), is_complete=lambda content: content.decode("utf-8-sig"))
fetch(SPARQL, path("chancellery.json"),
      body=urllib.parse.urlencode({"query": CHANCELLERY_QUERY}).encode(),
      headers={"Accept": "application/sparql-results+json",
               "Content-Type": "application/x-www-form-urlencoded"})
for date in REGISTER_DATES:
    year, month, day = date.split("-")
    fetch(REGISTER.format(date=f"{day}-{month}-{year}"), path(f"register_{date}.csv"),
          is_complete=lambda content: content.decode("utf-8-sig"))
for table in CHARACTERISTICS:
    fetch(PX_META.format(table=table), path(f"characteristic_{table}.json"))
    time.sleep(0.4)

# The vote days: Swissvotes also lists the scheduled ones, and the feed has the next one early.
with open(path("swissvotes_dataset.csv"), encoding="utf-8-sig") as file:
    dates = {"-".join(reversed(row["datum"].split("."))) for row in csv.DictReader(file, delimiter=";")}
days = sorted(date for date in dates if date >= SINCE)
missing = [day for day in days
           if not fetch(FEED.format(day=day.replace("-", "")), path(f"feed_{day.replace('-', '')}.json"))]

# The table: one call per vote, all areas and all measures.
meta = load_json(data, "table_meta.json")
area, vote = meta["variables"][0], meta["variables"][1]
votes = [code for code, text in zip(vote["values"], vote["valueTexts"]) if text[:10] >= SINCE]
for code in votes:
    if os.path.exists(path(f"table_{code}.json")):
        continue
    query = {"query": [{"code": area["code"], "selection": {"filter": "all", "values": ["*"]}},
                       {"code": vote["code"], "selection": {"filter": "item", "values": [code]}}],
             "response": {"format": "json"}}
    fetch(TABLE, path(f"table_{code}.json"), body=json.dumps(query).encode(),
          headers={"Content-Type": "application/json"})
    time.sleep(0.4)

print(f"vote days since {SINCE}, scheduled ones included: {len(days)}; no feed file yet for: {missing}")
print(f"votes in the table since {SINCE}: {len(votes)}")
print(f"files in {data}: {len(os.listdir(data))}")
