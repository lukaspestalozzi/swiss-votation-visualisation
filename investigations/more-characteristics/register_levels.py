"""The classifications the BFS register gives each municipality of the votes' list.

It asks the register for the levels of the list of 2026-01-01 with their labels in German,
French and Italian, and prints, for the classifications that sort municipalities by kind, each
class with its number of municipalities and its three names, and the classes of named
municipalities. Standard library only; it reuses `figures.py` of
`investigations/characteristics/`.

    python3 register_levels.py /path/outside/the/repository
"""

import collections
import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "characteristics"))

from figures import REGISTER, VOTES_LIST, data_dir, fetch, register  # noqa: E402

# The register's columns: urban or rural type, type of municipality in 9 classes, degree of
# urbanisation, language region, mountain areas.
CLASSIFICATIONS = ["STALAN2020", "GDETYP2020_9", "DEGURB2021", "SPRGEB2020", "MONT2019"]
NAMED = ["Zürich", "Wettingen", "Speicher", "Bister", "Zwischbergen", "Genève", "Lugano"]


def main():
    data = data_dir()
    path = os.path.join(data, f"levels_{VOTES_LIST}.csv")
    fetch(REGISTER.format(what=f"levels?date={VOTES_LIST}&labelLanguages=de,fr,it"), path,
          is_complete=lambda c: c.decode())
    fetch(REGISTER.format(what=f"snapshot?date={VOTES_LIST}"),
          os.path.join(data, f"register_{VOTES_LIST}.csv"), is_complete=lambda c: c.decode())
    with open(path, encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))
    numbers = {int(row["BfsCode"]) for row in rows}
    print(f"{len(rows)} rows, {len(numbers)} numbers; the numbers of the votes' list: "
          f"{numbers == set(register(data, VOTES_LIST))}")
    print("columns:", ", ".join(c for c in rows[0] if not c.endswith(("_de", "_fr", "_it"))))
    for column in CLASSIFICATIONS:
        count = collections.Counter(row[column] for row in rows)
        names = {row[column]: [row[f"{column}_{lang}"] for lang in ("de", "fr", "it")]
                 for row in rows}
        print(f"{column}: {len(count)} classes, {sum(not row[column] for row in rows)} "
              "municipalities without one")
        for code in sorted(count, key=int):
            print(f"  {code:>3} {count[code]:>5}  {' | '.join(names[code])}")
    for name in NAMED:
        row = next(row for row in rows if row["Name"] == name)
        print(f"{name} ({row['BfsCode']}):",
              ", ".join(f"{c} {row[c]} {row[c + '_de']}" for c in CLASSIFICATIONS))


if __name__ == "__main__":
    main()
