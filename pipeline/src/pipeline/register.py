"""Reader of the BFS register of municipalities: the list of municipalities on one date.

The Federal Statistical Office (BFS) gives the municipalities, districts and cantons that
existed on a date: https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=<dd-mm-yyyy>.
A row's `Level` is 1 for a canton, 2 for a district, 3 for a municipality; its `Parent` is the
`HistoricalCode` of the row it belongs to.
"""

import csv
import io
import re
from dataclasses import dataclass

from pipeline.counts import SourceError
from pipeline.feed import CANTONS

COLUMNS = ("HistoricalCode", "BfsCode", "Level", "Parent", "Name", "ShortName")


@dataclass(frozen=True)
class Municipality:
    """A municipality of the list: its BFS number, its name and its canton on the date."""

    number: int
    name: str
    canton: str


def read_register(text: str, source: str) -> list[Municipality]:
    """Read the register's CSV text; `source` names it in messages. Ordered by number."""
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows or any(column not in rows[0] for column in COLUMNS):
        raise SourceError(f"{source}: the columns {COLUMNS} are not all there")
    levels: dict[str, dict[str, dict[str, str]]] = {"1": {}, "2": {}}
    for row in rows:
        if row["Level"] in levels:
            levels[row["Level"]][row["HistoricalCode"]] = row
    municipalities: dict[int, Municipality] = {}
    for row in rows:
        if row["Level"] != "3":
            continue
        code = row["BfsCode"]
        where = f"{source}, municipality {code}"
        if not re.fullmatch(r"[0-9]+", code):
            raise SourceError(f"{where}: the number is not a number")
        district = levels["2"].get(row["Parent"])
        canton = levels["1"].get(district["Parent"]) if district else None
        abbreviation = canton["ShortName"] if canton else None
        if abbreviation not in CANTONS:
            raise SourceError(f"{where}: its canton is {abbreviation!r}, not one of the 26")
        if not row["Name"].strip():
            raise SourceError(f"{where}: it has no name")
        number = int(code)
        if number in municipalities:
            raise SourceError(f"{where}: the register gives the number {number} twice")
        municipalities[number] = Municipality(number, row["Name"], str(abbreviation))
    return [municipalities[number] for number in sorted(municipalities)]
