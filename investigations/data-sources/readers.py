"""Read the downloaded files into plain dictionaries, one shape per source."""

import csv
import glob
import os
import re

from sources import FIRST_SPECIAL_CODE, SINCE, load_json, number

MEASURES = {"1": "registered", "2": "cast", "4": "valid", "5": "yes", "6": "no"}


def table_votes(data):
    """The BFS table: per vote the national row, the cantons and the municipal entries."""
    meta = load_json(data, "table_meta.json")
    area, vote = meta["variables"][0], meta["variables"][1]
    label = dict(zip(area["values"], area["valueTexts"]))
    votes = []
    for code, text in zip(vote["values"], vote["valueTexts"]):
        if text[:10] < SINCE:
            continue
        rows = {}
        for row in load_json(data, f"table_{code}.json")["data"]:
            place, _, measure = row["key"]
            if measure in MEASURES:
                rows.setdefault(place, {})[MEASURES[measure]] = number(row["values"][0])
        votes.append({
            "id": code, "date": text[:10], "title": text[11:], "national": rows["CH"],
            "cantons": {c: r for c, r in rows.items() if label[c].startswith("- ")},
            "municipal": {c: r for c, r in rows.items() if label[c].startswith("......")},
        })
    names = {c: t.strip(".").split(" (")[0] for c, t in label.items() if t.startswith("......")}
    return sorted(votes, key=lambda v: (v["date"], v["id"])), names


def is_special(code):
    return int(code) >= FIRST_SPECIAL_CODE


def feed_votes(data):
    """The BFS feed: per vote its kind, its national result and its municipal entries."""
    votes = []
    for path in sorted(glob.glob(os.path.join(data, "feed_*.json"))):
        day = load_json(data, os.path.basename(path))
        for vote in day["schweiz"].get("vorlagen") or []:
            result, cantons = vote["resultat"], vote.get("staende") or {}
            has_cantons = cantons.get("jaStaendeGanz") is not None
            votes.append({
                "id": str(vote["vorlagenId"]), "day": day["abstimmtag"],
                "kind": vote["vorlagenArtId"], "double": vote["doppeltesMehr"],
                "main": vote.get("hauptvorlagenId"), "accepted": vote["vorlageAngenommen"],
                "provisional": vote["provisorisch"],
                "titles": {t["langKey"]: t["text"] for t in vote["vorlagenTitel"] if t["text"]},
                "yes": result.get("jaStimmenAbsolut"), "no": result.get("neinStimmenAbsolut"),
                "valid": result.get("gueltigeStimmen"),
                "registered": result.get("anzahlStimmberechtigte"),
                "cantons_yes": cantons["jaStaendeGanz"] + cantons["jaStaendeHalb"] / 2 if has_cantons else None,
                "cantons_no": cantons["neinStaendeGanz"] + cantons["neinStaendeHalb"] / 2 if has_cantons else None,
                "cantons": [c["resultat"] for c in vote["kantone"]],
                "municipal": {g["geoLevelnummer"]: (g["geoLevelname"], g["resultat"])
                              for c in vote["kantone"] for g in c["gemeinden"]},
            })
    return votes


def swissvotes(data):
    """Swissvotes, keyed like the BFS: its number 596 is the BFS vote 5960, 682.1 is 6821."""
    with open(os.path.join(data, "swissvotes_dataset.csv"), encoding="utf-8-sig") as file:
        return {str(round(float(row["anr"]) * 10)): row for row in csv.DictReader(file, delimiter=";")}


def cantonal_votes(text):
    """The Chancellery writes "15 3/2" for 15 cantons and 3 half cantons, and "" for none."""
    if text is None:
        return None
    match = re.fullmatch(r"\s*(\d+)?\s*(?:(\d+)/2)?\s*", text)
    return int(match.group(1) or 0) + int(match.group(2) or 0) / 2


def chancellery_votes(data):
    """The Chancellery: per vote number the rows with figures (682 has three)."""
    votes = {}
    for row in load_json(data, "chancellery.json")["results"]["bindings"]:
        value = lambda key: row[key]["value"] if key in row else None
        votes.setdefault(value("number"), []).append({
            "date": value("date"), "title": value("title"),
            "yes": number(value("yes")), "no": number(value("no")),
            "cantons_yes": cantonal_votes(value("cy")), "cantons_no": cantonal_votes(value("cn")),
            "source": value("source"), "note": value("note"),
        })
    return votes


def register(data, date):
    """The numbers of the municipalities that existed on `date`."""
    with open(os.path.join(data, f"register_{date}.csv"), encoding="utf-8-sig") as file:
        return {int(row["BfsCode"]) for row in csv.DictReader(file) if row["Level"] == "3"}
