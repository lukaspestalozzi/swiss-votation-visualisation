"""Found while proposing add-vote-list: what the yes and no of a tie-break question stand for.

Run as `python3 check_tie_break.py <data directory>`. The BFS gives a tie-break question yes and
no votes; the Federal Chancellery gives, for the tie-break questions it has validated, the votes
for the initiative and for the counter-proposal. Both are compared, question by question.
"""

import json
import os
import time
import urllib.parse

from sources import SPARQL, TABLE, data_dir, fetch, load_json

QUERY = """
PREFIX cube: <https://cube.link/>
PREFIX vote: <https://politics.ld.admin.ch/political-rights/popular-vote/>
SELECT ?date ?id ?initiative ?counter WHERE {
  ?obs a cube:Observation ; vote:date ?date ; vote:id ?id .
  OPTIONAL { ?obs vote:region ?region . }
  FILTER(!BOUND(?region) || ?region = <https://ld.admin.ch/country/CHE>)
  ?obs vote:stimmenInitiative ?initiative ; vote:stimmenGegenentwurf ?counter .
  FILTER(STR(?initiative) != "" && STR(?counter) != "")
} ORDER BY ?date ?id
"""

data = data_dir()
path = lambda name: os.path.join(data, name)

fetch(SPARQL, path("chancellery_tie_break.json"),
      body=urllib.parse.urlencode({"query": QUERY}).encode(),
      headers={"Accept": "application/sparql-results+json",
               "Content-Type": "application/x-www-form-urlencoded"})
rows = load_json(data, "chancellery_tie_break.json")["results"]["bindings"]

fetch(TABLE, path("table_meta.json"))
meta = load_json(data, "table_meta.json")
area, vote, measure = meta["variables"][0], meta["variables"][1], meta["variables"][2]
titles = dict(zip(vote["values"], vote["valueTexts"]))

same = 0
for row in rows:
    vote_id = row["id"]["value"]
    name = f"table_national_{vote_id}.json"
    query = {"query": [{"code": area["code"], "selection": {"filter": "item", "values": ["CH"]}},
                       {"code": vote["code"], "selection": {"filter": "item", "values": [vote_id]}},
                       {"code": measure["code"], "selection": {"filter": "item", "values": ["5", "6"]}}],
             "response": {"format": "json"}}
    fetch(TABLE, path(name), body=json.dumps(query).encode(), headers={"Content-Type": "application/json"})
    time.sleep(0.4)
    figures = {r["key"][2]: int(r["values"][0]) for r in load_json(data, name)["data"]}
    initiative, counter = int(row["initiative"]["value"]), int(row["counter"]["value"])
    match = (figures["5"], figures["6"]) == (initiative, counter)
    same += match
    print(f"{row['date']['value']} id {vote_id} {titles.get(vote_id, '')[11:70]}")
    print(f"  BFS table: yes {figures['5']:,}, no {figures['6']:,}")
    print(f"  Chancellery: for the initiative {initiative:,}, for the counter-proposal {counter:,}"
          f" -> {'the same' if match else 'DIFFERENT'}")
print(f"\ntie-break questions whose yes are the votes for the initiative and whose no those for the "
      f"counter-proposal: {same} of {len(rows)}")
