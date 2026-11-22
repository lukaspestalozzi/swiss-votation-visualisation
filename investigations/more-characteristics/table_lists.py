"""The list of municipalities a STAT-TAB table gives: the date of the register's list with
exactly the table's municipalities.

It reads the tables' descriptions that `stat_tab_catalogue.py` keeps, takes the numbers of the
municipalities from the geographic variable, and compares them with the register's list on each
date on which that list changed since 2010, the newest first, and with the list of the census of
2000. Standard library only; it reuses `figures.py` of `investigations/characteristics/`.

    python3 table_lists.py /path/outside/the/repository px-x-0102010000_101 ...
"""

import csv
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "characteristics"))

from figures import FIRST_SPECIAL_CODE, REGISTER, fetch  # noqa: E402

CENSUS_2000 = "05-12-2000"


def numbers_of(description):
    """The BFS numbers of a table's municipalities, and how the table writes them."""
    place = max(description["variables"], key=lambda v: len(v["values"]))
    codes, labels = place["values"], place["valueTexts"]
    if any(label.startswith("......") for label in labels):
        pairs = [(c, l) for c, l in zip(codes, labels) if l.startswith("......")]
        in_label = [re.match(r"\.{6}(\d{4}) ", l) for _, l in pairs]
        if all(in_label):
            return {int(m.group(1)) for m in in_label}, "the number in the label"
        special = [c for c, _ in pairs if int(c) >= FIRST_SPECIAL_CODE]
        return ({int(c) for c, _ in pairs} - {int(c) for c in special},
                f"the number as the code, {len(special)} codes from {FIRST_SPECIAL_CODE} on left out")
    numeric = [c for c in codes if c.isdigit() and 0 < int(c) < FIRST_SPECIAL_CODE]
    return {int(c) for c in numeric}, f"plain names, {len(codes) - len(numeric)} other codes"


def register_numbers(data, date):
    path = os.path.join(data, f"register_{date}.csv")
    fetch(REGISTER.format(what=f"snapshot?date={date}"), path, is_complete=lambda c: c.decode())
    with open(path, encoding="utf-8-sig") as file:
        return {int(r["BfsCode"]) for r in csv.DictReader(file) if r["Level"] == "3"}


def change_dates(data):
    """The dates since 2010 on which the register's list changed, the newest first."""
    path = os.path.join(data, "mutations_2010_2026.csv")
    fetch(REGISTER.format(what="mutations?startPeriod=01-01-2010&endPeriod=01-01-2026"), path,
          is_complete=lambda c: c.decode())
    with open(path, encoding="utf-8-sig") as file:
        dates = {tuple(reversed(r["MutationDate"].split("."))) for r in csv.DictReader(file)}
    return ["-".join(reversed(date)) for date in sorted(dates, reverse=True)]


def main():
    data, tables = sys.argv[1], sys.argv[2:]
    dates = [*change_dates(data), CENSUS_2000]
    print(f"{len(dates) - 1} dates of change from {dates[-2]} to {dates[0]}")
    for table in tables:
        with open(os.path.join(data, "tables", f"{table}.json"), encoding="utf-8") as file:
            description = json.load(file)
        numbers, how = numbers_of(description)
        found = next((d for d in dates if register_numbers(data, d) == numbers), None)
        if found is None:
            nearest = min(dates, key=lambda d: len(register_numbers(data, d) ^ numbers))
            listed = register_numbers(data, nearest)
            found = (f"none; nearest {nearest}: {len(numbers - listed)} not in it, "
                     f"{len(listed - numbers)} of it missing")
        print(f"{table} | {description['title'][:80]} | {len(numbers)} municipalities ({how}) | "
              f"list of {found}")


if __name__ == "__main__":
    main()
