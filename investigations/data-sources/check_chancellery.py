"""The Federal Chancellery's validated results against the BFS feed, vote by vote."""

from readers import chancellery_votes, feed_votes
from sources import data_dir

data = data_dir()
official = chancellery_votes(data)
feed = [v for v in feed_votes(data) if v["yes"] is not None]
print(f"vote numbers at the Chancellery since 2013: {len(official)}")

same, different, pending = [], [], []
for v in feed:
    rows = [row for row in official.get(v["id"][:-1], []) if row["yes"] is not None]
    if not rows:
        pending.append(v)
    elif any((row["yes"], row["no"]) == (v["yes"], v["no"]) for row in rows):
        same.append(v)
        row = next(row for row in rows if (row["yes"], row["no"]) == (v["yes"], v["no"]))
        if v["double"] and (row["cantons_yes"], row["cantons_no"]) != (v["cantons_yes"], v["cantons_no"]):
            print(f"  cantonal votes differ: {v['id']} {v['day']}")
    else:
        different.append((v, rows))
print(f"votes of the feed with a result: {len(feed)}")
print(f"  yes and no identical, and the cantonal votes where the double majority is needed: {len(same)}")
print(f"  not validated yet at the Chancellery: {len(pending)}, the votes of {sorted({v['day'] for v in pending})}")
print(f"  different: {len(different)}")
for v, rows in different:
    for row in rows:
        print(f"    {v['id']} {v['day']} {v['titles']['de'][:60]}: feed yes {v['yes']:,} no {v['no']:,}; "
              f"Chancellery yes {row['yes']:,} no {row['no']:,} ({row['source']})")

print("\nnotes of the Chancellery:")
for number, rows in sorted(official.items()):
    for row in rows:
        if row["note"]:
            print(f"  {row['date']} no. {number}, {row['source']}: {row['note'][:400]}")
