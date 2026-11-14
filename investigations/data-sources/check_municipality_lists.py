"""Which list of municipalities does each source use?"""

import re

from readers import feed_votes, is_special, register, table_votes
from sources import CHARACTERISTICS, REGISTER_DATES, data_dir, load_json

data = data_dir()
registers = {date: register(data, date) for date in REGISTER_DATES}
print("municipalities in the register: " + ", ".join(f"{date}: {len(r)}" for date, r in registers.items()))


def compare(name, numbers):
    best = min(registers, key=lambda date: len(numbers ^ registers[date]))
    print(f"  {name}: {len(numbers)} municipalities; closest register: {best} "
          f"({len(numbers - registers[best])} not in it, {len(registers[best] - numbers)} of it missing)")


votes, _ = table_votes(data)
print("votes:")
compare("table, every vote", {int(c) for c in votes[0]["municipal"] if not is_special(c)})
lists = {}
for vote in feed_votes(data):
    lists.setdefault(frozenset(int(c) for c in vote["municipal"] if not is_special(c)), []).append(vote["day"])
for numbers, days in lists.items():
    compare(f"feed, {min(days)} to {max(days)}", set(numbers))

print("characteristics:")
for table, what in CHARACTERISTICS.items():
    meta = load_json(data, f"characteristic_{table}.json")
    for variable in meta["variables"]:
        if variable["text"] == "Jahr":
            years = sorted(variable["valueTexts"])
        entries = [(code, text) for code, text in zip(variable["values"], variable["valueTexts"])
                   if text.startswith("......")]
        if entries:
            by_number = all(re.fullmatch(r"\d{4}", code) for code, _ in entries)
            places = entries
    print(f"  {table}, {what}: years {years[0]} to {years[-1]} ({len(years)})")
    if by_number:
        compare("    its list", {int(code) for code, _ in places})
    else:
        print(f"    its list: {len(places)} municipalities, not identified by their BFS number "
              f"(first codes: {[code for code, _ in places[:3]]}); not compared")
