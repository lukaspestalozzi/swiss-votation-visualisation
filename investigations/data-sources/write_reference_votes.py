"""Write the reference data of the calculation: all municipal entries of seven named votes.

Run as `python3 write_reference_votes.py <data directory> <output file>`. It downloads the
BFS files of the vote days it needs into the data directory, unless they are there, and writes
`calculation/src/reference-votes.json` when given that path. It prints one line per vote.

The BFS rewrites its files after a merger of municipalities: a later run gives other entries
and another count of them, and the same sums.
"""

import json
import os
import sys

from sources import FEED, HALF_VOTE, fetch, load_json

# The BFS files number the cantons 1 to 26 in the order of the Federal Constitution, art. 1.
CANTONS = "ZH BE LU UR SZ OW NW GL ZG FR SO BS BL SH AR AI SG GR AG TG TI VD VS NE GE JU".split()
# The kind of a vote in the BFS files (vorlagenArtId), and its name in the calculation.
KINDS = {1: "mandatory-referendum", 2: "optional-referendum", 3: "popular-initiative"}
# Vote day and the Federal Chancellery's number; the id of the BFS is that number times ten.
VOTES = [
    ("2013-03-03", 567),
    ("2013-03-03", 568),
    ("2015-06-14", 595),
    ("2016-02-28", 596),
    ("2017-09-24", 614),
    ("2020-11-29", 636),
    ("2025-09-28", 679),
]
ABOUT = (
    "Test data of the calculation: the entries of seven national votes, per canton as "
    "[BFS number, yes, no]. Written by investigations/data-sources/write_reference_votes.py "
    "from the BFS files of the vote days; see investigations/data-sources.md."
)

if len(sys.argv) != 3:
    sys.exit(f"usage: python3 {os.path.basename(sys.argv[0])} <data directory> <output file>")
data, output = sys.argv[1], sys.argv[2]
os.makedirs(data, exist_ok=True)

blocks = []
for date, number in VOTES:
    day = date.replace("-", "")
    if not fetch(FEED.format(day=day), os.path.join(data, f"feed_{day}.json")):
        sys.exit(f"the BFS has no file for {date}")
    feed = load_json(data, f"feed_{day}.json")
    vote = next(v for v in feed["schweiz"]["vorlagen"] if v["vorlagenId"] == number * 10)
    title = next(t["text"] for t in vote["vorlagenTitel"] if t["langKey"] == "de")

    lines, yes, no, in_favour, against = [], 0, 0, 0.0, 0.0
    for canton in vote["kantone"]:
        abbreviation = CANTONS[int(canton["geoLevelnummer"]) - 1]
        entries = [
            [int(g["geoLevelnummer"]), g["resultat"]["jaStimmenAbsolut"], g["resultat"]["neinStimmenAbsolut"]]
            for g in canton["gemeinden"]
        ]
        canton_yes, canton_no = sum(e[1] for e in entries), sum(e[2] for e in entries)
        yes, no = yes + canton_yes, no + canton_no
        weight = 0.5 if abbreviation in HALF_VOTE else 1
        if canton_yes > canton_no:
            in_favour += weight
        else:
            against += weight
        lines.append(f"        {json.dumps(abbreviation)}: {json.dumps(entries, separators=(',', ':'))}")

    # The entries must add up to what the file itself gives for Switzerland.
    national = vote["resultat"]
    if (yes, no) != (national["jaStimmenAbsolut"], national["neinStimmenAbsolut"]):
        sys.exit(f"number {number}: the entries sum to {yes} yes and {no} no, the file says otherwise")

    head = {"number": number, "date": date, "title": title, "kind": KINDS[vote["vorlagenArtId"]]}
    blocks.append(
        "    {\n"
        + "".join(f"      {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)},\n" for key, value in head.items())
        + '      "entries": {\n'
        + ",\n".join(lines)
        + "\n      }\n    }"
    )
    count = sum(len(canton["gemeinden"]) for canton in vote["kantone"])
    print(f"{number} {date} {head['kind']:20} entries {count} | yes {yes:,} no {no:,} "
          f"| cantonal votes {in_favour:g} : {against:g} | {title[:50]}")

with open(output, "w", encoding="utf-8") as file:
    file.write("{\n" + f'  "about": {json.dumps(ABOUT)},\n' + '  "votes": [\n' + ",\n".join(blocks) + "\n  ]\n}\n")
