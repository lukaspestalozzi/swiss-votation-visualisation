"""Found while proposing add-result-map: the municipal figures the specs of the map name.

Run as `python3 municipal_figures.py <data directory>`; standard library only. It reads the
BFS vote-day files (the feed) of two vote days and prints, for named municipalities, their yes
and no votes, their yes share, and the colour class the map gives them: the side with more votes,
and the class of that side's share (50 to 60%, 60 to 70%, 70 to 80%, 80% or more), compared in
whole numbers so that a share of exactly 60% falls into the class 60 to 70%.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data-sources"))

from readers import feed_votes  # noqa: E402
from sources import FEED, data_dir, fetch  # noqa: E402

DAYS = ["20160228", "20240303"]
NAMED = {
    "5960": [261, 351, 1, 946, 1703, 29, 2702, 389],
    "6650": [6745, 1211, 5761],
}

data = data_dir()
for day in DAYS:
    fetch(FEED.format(day=day), os.path.join(data, f"feed_{day}.json"))


def colour_class(yes, no):
    total = yes + no
    if yes == no:
        return "as many yes as no"
    won = max(yes, no)
    k = 4 if 10 * won >= 8 * total else 3 if 10 * won >= 7 * total else 2 if 10 * won >= 6 * total else 1
    side = "yes" if yes > no else "no"
    return f"{side}, class {k} ({['50-60%', '60-70%', '70-80%', '80% or more'][k - 1]} {side})"


for vote in feed_votes(data):
    if vote["id"] not in NAMED:
        continue
    print(f"{vote['day']} vote {vote['id']}: {vote['titles']['de']}")
    for number in NAMED[vote["id"]]:
        if str(number) not in vote["municipal"]:
            print(f"  {number}: no entry")
            continue
        name, result = vote["municipal"][str(number)]
        yes, no = result["jaStimmenAbsolut"], result["neinStimmenAbsolut"]
        print(f"  {number} {name}: yes {yes:,} no {no:,}, yes share {100 * yes / (yes + no):.4f}%,"
              f" {colour_class(yes, no)}")
