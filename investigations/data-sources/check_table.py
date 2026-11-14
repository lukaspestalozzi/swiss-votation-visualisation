"""The BFS table: is it consistent in itself, and which entries are no municipality on the map?"""

from readers import is_special, table_votes
from sources import data_dir

votes, names = table_votes(data_dir())
total = lambda rows, measure: sum(row[measure] or 0 for row in rows.values())

consistent = [v for v in votes if all(
    v["national"][m] == total(v["municipal"], m) == total(v["cantons"], m)
    for m in ("registered", "cast", "valid", "yes", "no"))]
print(f"votes since 2013: {len(votes)}, on {len({v['date'] for v in votes})} days, "
      f"{votes[0]['date']} to {votes[-1]['date']}")
print(f"national row == sum of municipal entries == sum of cantons "
      f"(registered, cast, valid, yes, no): {len(consistent)} of {len(votes)}")
for v in votes:
    blank = v["national"]["valid"] - v["national"]["yes"] - v["national"]["no"]
    if blank:
        print(f"  valid ballots exceed yes + no by {blank:,}: {v['id']} {v['date']} {v['title'][:60]}")

print("\nmunicipalities without a result of their own:")
periods = {}
for v in votes:
    without = tuple(c for c, row in v["municipal"].items() if not is_special(c) and row["yes"] is None)
    periods.setdefault(without, []).append(v["date"])
for without, dates in periods.items():
    print(f"  {min(dates)} to {max(dates)}: {len(without)}: {', '.join(names[c] for c in without)}")

print("\nentries that are no municipality (Swiss abroad), with a result:")
periods = {}
for v in votes:
    special = tuple(c for c, row in v["municipal"].items() if is_special(c) and row["yes"] is not None)
    periods.setdefault(special, []).append(v)
for special, group in periods.items():
    shares = [100 * sum(v["municipal"][c]["valid"] for c in special) / v["national"]["valid"] for v in group]
    print(f"  {group[0]['date']} to {group[-1]['date']}: {len(special)} cantons "
          f"({', '.join(names[c][:2] for c in special)}); "
          f"{min(shares):.2f}% to {max(shares):.2f}% of the valid ballots")
regular = sum(1 for c in votes[0]["municipal"] if not is_special(c))
print(f"\nmunicipalities in the table: {regular}; special entries: {len(votes[0]['municipal']) - regular}")
