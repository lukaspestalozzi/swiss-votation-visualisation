"""The BFS's own words, in German, French and Italian, for what the 14 characteristics count:
the titles of their STAT-TAB tables and the labels of the codes they use, from the tables'
descriptions in each language. Standard library only; it asks slowly, one description every
two seconds. STAT-TAB describes some tables in German and French only: it answers HTTP 400 for a
language it does not have.

    python3 official_terms.py /path/outside/the/repository
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://www.pxweb.bfs.admin.ch/api/v1/{language}/{table}/{table}.px"
# Per table: the variable (by its place among the table's variables) and the codes of interest.
TABLES = {
    "px-x-0102010000_100": {3: ["2"]},
    "px-x-0602010000_102": {2: ["1", "2", "3"], 3: ["1", "2"]},
    "px-x-0702000000_104": {0: ["0", "10"], 2: ["1"]},
    "px-x-4003000000_122": {2: ["1", "8", "17"]},
    "px-x-4003000000_161": {0: ["1", "2", "7", "8", "9", "10"]},
    "px-x-0903020000_113": {2: ["3", "4", "5"]},
    "px-x-0902020100_114": {1: ["EFH"]},
}


def description(data, table, language):
    """A table's description in a language, or None where STAT-TAB has none."""
    path = os.path.join(data, "terms", f"{table}.{language}.json")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            with urllib.request.urlopen(API.format(language=language, table=table),
                                        timeout=60) as answer:
                content = answer.read()
        except urllib.error.HTTPError as error:
            if error.code != 400:
                raise
            content = b"null"
        with open(path, "wb") as file:
            file.write(content)
        time.sleep(2)
    with open(path, encoding="utf-8") as file:
        return json.load(file)


def main():
    data = sys.argv[1]
    for table, wanted in TABLES.items():
        found = {language: description(data, table, language) for language in ("de", "fr", "it")}
        print(table)
        for language, text in found.items():
            print(f"  {language}: {text['title'] if text else 'no description in this language'}")
        for place, codes in wanted.items():
            for code in codes:
                words = []
                for text in found.values():
                    if text is None:
                        words.append("(none)")
                        continue
                    variable = text["variables"][place]
                    words.append(variable["valueTexts"][variable["values"].index(code)])
                print(f"    {found['de']['variables'][place]['text']} {code}: " + " | ".join(words))


if __name__ == "__main__":
    main()
