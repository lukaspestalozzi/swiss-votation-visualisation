"""The census of 2000 per municipality: religion and highest completed education.

It asks STAT-TAB for the two tables, checks their list against the register's list of
2000-12-05, that every count is a whole number and that the parts add up to the totals, brings
the counts onto the votes' list as the languages of 2000 come onto it, and prints the shares of
named municipalities and how they spread over the 2,110. Standard library only; it reuses
`figures.py` of `investigations/characteristics/`.

    python3 census_2000.py /path/outside/the/repository
"""

import os
import statistics
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "characteristics"))

from figures import (  # noqa: E402
    GEO, REGISTER, VOTES_LIST, cube, data_dir, everything, fetch, item, municipality,
    onto_votes_list, px_query, register,
)

RELIGION = "px-x-4003000000_122"
EDUCATION = "px-x-4003000000_161"
LIST = "05-12-2000"
# The codes of the religions: Evangelical Reformed, Roman Catholic, no affiliation, no answer.
REFORMED, CATHOLIC, NONE, UNSTATED = "1", "8", "17", "18"
# The codes of the levels of education.
LEVELS = {
    "none or compulsory school": ["1", "2"],
    "upper secondary": ["3", "4", "5", "6"],
    "tertiary": ["7", "8", "9", "10"],
    "no answer": ["11"],
    "of or below school age": ["12", "13"],
}
NAMED = {261: "Zürich", 6172: "Bister", 1061: "Luzern", 6621: "Genève", 5192: "Lugano",
         3506: "Vaz/Obervaz", 351: "Bern", 4001: "Aarau"}


def download(data):
    px_query(data, RELIGION, "religion_2000", [
        item("Wohnsitztyp", ["1"]), everything(GEO), everything("Religion")])
    px_query(data, EDUCATION, "education_2000", [
        everything("Höchste abgeschlossene Ausbildung"), everything(GEO),
        item("Staatsangehörigkeit (Kategorie)", ["0"]), item("Geschlecht", ["0"])])
    for date in (LIST, VOTES_LIST):
        fetch(REGISTER.format(what=f"snapshot?date={date}"),
              os.path.join(data, f"register_{date}.csv"), is_complete=lambda c: c.decode())
    fetch(REGISTER.format(what=f"correspondances?startPeriod={LIST}&endPeriod={VOTES_LIST}"),
          os.path.join(data, f"correspondences_{LIST}.csv"), is_complete=lambda c: c.decode())


def per_municipality(data, name, dimension):
    """{number on the table's list: {code of `dimension`: count}}, checked as the file says."""
    ids, values, labels, symbols = cube(data, f"{name}.json")
    place, what = ids.index(GEO), ids.index(dimension)
    counts = {}
    for key, value in values.items():
        number = municipality(key[place], labels[GEO][key[place]])
        if number is not None:
            counts.setdefault(number, {})[key[what]] = value
    missing = sum(value is None for row in counts.values() for value in row.values())
    fractions = sum(value is not None and value != int(value)
                    for row in counts.values() for value in row.values())
    off = [n for n, row in counts.items()
           if sum(v for code, v in row.items() if code != "0") != row["0"]]
    on_list = register(data, LIST)
    print(f"{name}: {len(counts)} municipalities, the register's list of {LIST} has "
          f"{len(on_list)}; the same numbers: {set(counts) == set(on_list)}")
    print(f"  cells without a value: {missing} (signs {sorted(set(symbols.values()))}); "
          f"with a fraction: {fractions}; municipalities whose parts do not add up to the "
          f"total: {len(off)}")
    codes = list(labels[dimension])
    total = {code: sum(row[code] for row in counts.values()) for code in codes}
    swiss = {key[what]: value for key, value in values.items()
             if labels[GEO][key[place]] == "Schweiz"}
    print(f"  the municipalities add up to the table's Switzerland: {total == swiss}; "
          f"Switzerland: {swiss['0']:,}")
    return counts, codes, labels[dimension]


def spread(name, shares):
    known = sorted(s for s in shares.values() if s is not None)
    q = statistics.quantiles(known, n=10)
    print(f"  {name}: {len(known)} of {len(shares)} with a figure; least {known[0]:.2f}%, "
          f"1st decile {q[0]:.2f}%, median {statistics.median(known):.2f}%, "
          f"9th decile {q[8]:.2f}%, most {known[-1]:.2f}%")


def main():
    data = data_dir()
    download(data)

    religion, codes, names = per_municipality(data, "religion_2000", "Religion")
    rows, groups = onto_votes_list(
        {n: [row[c] for c in codes] for n, row in religion.items()}, data, LIST)
    print(f"  on the votes' list: {len(rows)} municipalities, "
          f"{sum(r is None for r in rows.values())} without a figure, "
          f"{len({g for g in groups.values() if len(g) > 1})} groups of several")
    index = {code: i for i, code in enumerate(codes)}
    swiss = [sum(r[i] for r in {id(g): rows[min(g)] for g in groups.values()}.values())
             for i in range(len(codes))]
    print("  Switzerland, on the votes' list:",
          ", ".join(f"{names[c]} {swiss[index[c]]:,} ({100 * swiss[index[c]] / swiss[0]:.2f}%)"
                    for c in (REFORMED, CATHOLIC, NONE, UNSTATED, "13")))
    for label, code in (("Evangelical Reformed", REFORMED), ("Roman Catholic", CATHOLIC),
                        ("no affiliation", NONE), ("no answer", UNSTATED)):
        spread(label, {n: 100 * r[index[code]] / r[0] if r[0] else None for n, r in rows.items()})
    for number, name in NAMED.items():
        r = rows[number]
        print(f"  {name} ({number}): {r[0]:,} inhabitants; Evangelical Reformed "
              f"{r[index[REFORMED]]:,} ({100 * r[index[REFORMED]] / r[0]:.2f}%), Roman Catholic "
              f"{r[index[CATHOLIC]]:,} ({100 * r[index[CATHOLIC]] / r[0]:.2f}%), no affiliation "
              f"{r[index[NONE]]:,} ({100 * r[index[NONE]] / r[0]:.2f}%), no answer "
              f"{r[index[UNSTATED]]:,}")

    education, codes, names = per_municipality(
        data, "education_2000", "Höchste abgeschlossene Ausbildung")
    rows, groups = onto_votes_list(
        {n: [row[c] for c in codes] for n, row in education.items()}, data, LIST)
    index = {code: i for i, code in enumerate(codes)}
    level = {name: [index[c] for c in group] for name, group in LEVELS.items()}

    def of(row, name):
        return sum(row[i] for i in level[name])

    def answered(row):  # those past school age who named a level
        return of(row, "none or compulsory school") + of(row, "upper secondary") + of(row, "tertiary")

    swiss = [sum(r[i] for r in {id(g): rows[min(g)] for g in groups.values()}.values())
             for i in range(len(codes))]
    print("  Switzerland, on the votes' list:",
          ", ".join(f"{name} {of(swiss, name):,}" for name in LEVELS),
          f"; of those who named a level, tertiary {100 * of(swiss, 'tertiary') / answered(swiss):.2f}%, "
          f"none or compulsory school "
          f"{100 * of(swiss, 'none or compulsory school') / answered(swiss):.2f}%")
    for name in ("tertiary", "none or compulsory school"):
        spread(f"{name}, of those who named a level",
               {n: 100 * of(r, name) / answered(r) if answered(r) else None
                for n, r in rows.items()})
    spread("no answer, of those past school age",
           {n: 100 * of(r, "no answer") / (answered(r) + of(r, "no answer"))
            if answered(r) + of(r, "no answer") else None for n, r in rows.items()})
    for number, name in NAMED.items():
        r = rows[number]
        print(f"  {name} ({number}): named a level {answered(r):,}; tertiary "
              f"{of(r, 'tertiary'):,} ({100 * of(r, 'tertiary') / answered(r):.2f}%), none or "
              f"compulsory school {of(r, 'none or compulsory school'):,} "
              f"({100 * of(r, 'none or compulsory school') / answered(r):.2f}%), no answer "
              f"{of(r, 'no answer'):,}")


if __name__ == "__main__":
    main()
