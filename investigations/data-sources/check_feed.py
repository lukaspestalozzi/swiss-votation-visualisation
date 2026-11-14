"""The BFS feed: what does it say about each vote, and does it agree with the other sources?"""

import collections

from readers import feed_votes, swissvotes, table_votes
from sources import data_dir, number

data = data_dir()
feed = feed_votes(data)
counted = [v for v in feed if v["yes"] is not None]
print(f"votes in the feed: {len(feed)} on {len({v['day'] for v in feed})} days; "
      f"with a result: {len(counted)}, {counted[0]['day']} to {counted[-1]['day']}; "
      f"not yet voted: {sorted({v['day'] for v in feed if v['yes'] is None})}")
print("kind (vorlagenArtId) and whether the double majority is needed (doppeltesMehr):")
for (kind, double), count in sorted(collections.Counter((v["kind"], v["double"]) for v in feed).items()):
    print(f"  kind {kind}, double majority {double}: {count}")
print(f"titles in German, French and Italian: "
      f"{sum(1 for v in feed if {'de', 'fr', 'it'} <= set(v['titles']))} of {len(feed)}; "
      f"also Romansh and English: {sum(1 for v in feed if {'rm', 'en'} <= set(v['titles']))}")
print(f"marked provisional: the votes of {sorted({v['day'] for v in feed if v['provisional']})}")

sums = lambda v, key: sum(result.get(key) or 0 for _, result in v["municipal"].values())
print(f"sum of municipal entries == national result (yes and no): "
      f"{sum(1 for v in counted if (sums(v, 'jaStimmenAbsolut'), sums(v, 'neinStimmenAbsolut')) == (v['yes'], v['no']))}"
      f" of {len(counted)}")
print(f"sum of cantons == national result (yes): "
      f"{sum(1 for v in counted if sum(c['jaStimmenAbsolut'] for c in v['cantons']) == v['yes'])} of {len(counted)}")
print(f"a canton with as many yes as no votes: "
      f"{[v['id'] for v in counted if any(c['jaStimmenAbsolut'] == c['neinStimmenAbsolut'] for c in v['cantons'])]}")
print(f"cantonal votes split evenly: {[v['id'] for v in counted if v['cantons_yes'] is not None and v['cantons_yes'] == v['cantons_no']]}")

figures = lambda v: (v["yes"], v["no"], v["valid"], v["registered"])
table = {v["id"]: v["national"] for v in table_votes(data)[0]}
shared = [v for v in counted if v["id"] in table]
same = [v for v in shared if figures(v) == tuple(table[v["id"]][m] for m in ("yes", "no", "valid", "registered"))]
print(f"\nfeed and table, yes, no, valid and registered: identical for {len(same)} of {len(shared)} votes; "
      f"in the feed only: {sorted({v['day'] for v in counted if v['id'] not in table})}")

reference = swissvotes(data)
rows = [(v, reference[v["id"]]) for v in counted if v["id"] in reference and reference[v["id"]]["volkja"]]
print(f"feed and Swissvotes: {len(rows)} votes with figures in both; "
      f"Swissvotes has none for {len(counted) - len(rows)} votes since "
      f"{min(v['day'] for v in counted if v['id'] not in reference or not reference[v['id']]['volkja'])}")
for v, row in rows:
    theirs = tuple(number(row[key]) for key in ("volkja", "volknein", "gultig", "berecht"))
    if figures(v) != theirs:
        names = ("yes", "no", "valid", "registered")
        print(f"  {v['id']} {v['day']}: " + "; ".join(
            f"{name} {a:,} in the feed, {b:,} in Swissvotes" for name, a, b in zip(names, figures(v), theirs) if a != b))
