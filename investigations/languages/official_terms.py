"""Found while proposing add-interface-languages: the official French and Italian terms the screen
uses, and what the data files already hold in the three languages.

Run as `python3 investigations/languages/official_terms.py` from the root of the repository. It
uses the standard library only, asks the public sources below over the network and reads the
committed data files; it writes nothing. investigations/languages.md gives its output.
"""

import csv
import html
import io
import json
import re
import time
import urllib.parse
import urllib.request

LINDAS = "https://lindas.admin.ch/query"
FEDLEX = "https://fedlex.data.admin.ch/sparqlendpoint"
STAT_TAB = "https://www.pxweb.bfs.admin.ch/api/v1/{lang}/{table}/{table}.px"
REGISTER_APP = "https://www.agvchapp.bfs.admin.ch/{lang}"
THEMAKART = "https://dam-api.bfs.admin.ch/hub/api/dam/assets/36390072"
VOTE = "https://politics.ld.admin.ch/political-rights/popular-vote/"
LANGS = ("de", "fr", "it")


def get(url, data=None, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(request, timeout=150) as answer:
        return answer.read().decode("utf-8")


def sparql(endpoint, query):
    body = urllib.parse.urlencode({"query": query}).encode()
    text = get(endpoint, body, {"Accept": "text/csv"})
    return list(csv.DictReader(io.StringIO(text)))


def heading(text):
    print(f"\n## {text}")


# 1. The Chancellery's linked data: the kinds of vote, the verdicts, the majorities, and the
#    names of its figures, each in the three languages.
heading("Chancellery (LINDAS): kinds, verdicts, majorities")
rows = sparql(LINDAS, f"""
PREFIX schema: <http://schema.org/>
SELECT ?o ?name (LANG(?name) AS ?l) WHERE {{
  ?o schema:name ?name . FILTER(LANG(?name) IN ("de","fr","it"))
  FILTER(STRSTARTS(STR(?o), "{VOTE}typologie/") || STRSTARTS(STR(?o), "{VOTE}ergebnis/")
      || STRSTARTS(STR(?o), "{VOTE}ergebnisDetail/"))
}} ORDER BY ?o ?l""")
for row in rows:
    print(row["o"].removeprefix(VOTE), row["l"], row["name"], sep=" | ")

heading("Chancellery (LINDAS): the names of the figures")
rows = sparql(LINDAS, f"""
PREFIX schema: <http://schema.org/>
SELECT DISTINCT ?path ?name (LANG(?name) AS ?l) WHERE {{
  ?shape <http://www.w3.org/ns/shacl#path> ?path ; schema:name ?name .
  VALUES ?path {{ <{VOTE}jaAnteil> <{VOTE}stimmbeteiligung> <{VOTE}staendeJaText>
                 <{VOTE}staendeNeinText> }}
  FILTER(LANG(?name) IN ("de","fr","it"))
}} ORDER BY ?path ?l""")
for row in rows:
    print(row["path"].removeprefix(VOTE), row["l"], row["name"], sep=" | ")

# 2. The Federal Constitution, art. 139b and 142: the tie-break question, the majorities and the
#    cantonal votes.
heading("Federal Constitution, art. 139b and 142 (fedlex, version of 2024-03-03)")
for lang in LANGS:
    url = (
        "https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1999/404/20240303/"
        f"{lang}/html/fedlex-data-admin-ch-eli-cc-1999-404-20240303-{lang}-html-10.html"
    )
    text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", get(url))))
    for article, after in (("Art. 139 b ", "Art. 139 c"), ("Art. 142 ", "Art. 143 ")):
        start = text.find(article)
        end = text.find(after, start)
        print(lang, text[start:end].strip(), sep=" | ")

# 3. The Swiss Abroad Act (SR 195.1): its short title names the Swiss abroad.
heading("Swiss Abroad Act, SR 195.1 (fedlex)")
rows = sparql(FEDLEX, """
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?s ?o WHERE {
  VALUES ?s { <https://fedlex.data.admin.ch/eli/cc/2015/653/de>
              <https://fedlex.data.admin.ch/eli/cc/2015/653/fr>
              <https://fedlex.data.admin.ch/eli/cc/2015/653/it> }
  ?s jolux:titleAlternative ?o }""")
for row in rows:
    print(row["s"][-2:], row["o"], sep=" | ")

# 4. The parties: the Chancellery's register of parties and the parliament's parties.
heading("Parties: the Chancellery's register (short forms and names)")
rows = sparql(LINDAS, """
PREFIX schema: <http://schema.org/>
SELECT ?s ?name (LANG(?name) AS ?l) WHERE {
  ?s schema:name ?name . FILTER(LANG(?name) IN ("de","fr","it"))
  FILTER(REGEX(STR(?s), "political-party-register/(kurzform|name)/"))
} ORDER BY ?s ?l""")
for row in rows:
    print(row["s"].rsplit("political-party-register/", 1)[1], row["l"], row["name"], sep=" | ")

heading("Parties: the parliament's (CVP, BDP, the Centre, the Greens)")
rows = sparql(LINDAS, """
PREFIX schema: <http://schema.org/>
SELECT DISTINCT ?s ?p ?o (LANG(?o) AS ?l) WHERE {
  VALUES ?s { <https://politics.ld.admin.ch/party/14> <https://politics.ld.admin.ch/party/1551>
              <https://politics.ld.admin.ch/party/1586> <https://politics.ld.admin.ch/party/20> }
  VALUES ?p { schema:name schema:alternateName }
  ?s ?p ?o . FILTER(LANG(?o) IN ("de","fr","it"))
} ORDER BY ?s ?p ?l""")
for row in rows:
    print(row["s"].rsplit("/", 1)[1], row["p"].rsplit("/", 1)[1], row["l"], row["o"], sep=" | ")

# 5. The offices that give the sources.
heading("Offices (LINDAS)")
rows = sparql(LINDAS, """
PREFIX schema: <http://schema.org/>
SELECT ?s ?name (LANG(?name) AS ?l) WHERE {
  VALUES ?s { <https://ld.admin.ch/office/II.1.7> <https://ld.admin.ch/office/IV.1.5a>
              <https://ld.admin.ch/FCh> }
  ?s schema:name|schema:alternateName ?name . FILTER(LANG(?name) IN ("de","fr","it"))
} ORDER BY ?s ?l""")
for row in rows:
    print(row["s"].rsplit("/", 1)[1], row["l"], row["name"], sep=" | ")

# 6. STAT-TAB: the tables of the characteristics and of the votes. Only the population's table
#    answers in Italian; the others answer 400 for "it".
heading("STAT-TAB: titles and the values the screen names")
for table in ("px-x-0102010000_101", "px-x-1702020000_105", "px-x-0702000000_104",
              "px-x-4003000000_123", "px-x-1703030000_101"):  # fmt: skip
    for lang in LANGS:
        time.sleep(1.5)
        try:
            meta = json.loads(get(STAT_TAB.format(lang=lang, table=table)))
        except urllib.error.HTTPError as error:
            print(table, lang, f"HTTP {error.code}", sep=" | ")
            continue
        print(table, lang, meta["title"], sep=" | ")
        for variable in meta["variables"]:
            if len(variable["valueTexts"]) <= 40:
                print("   ", variable["text"], variable["valueTexts"][:8], sep=" | ")

# 7. The BFS register application: the name of the register in the three languages.
heading("BFS register application")
for lang in LANGS:
    text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", get(REGISTER_APP.format(lang=lang)))))
    found = re.search(r"PDF (.{20,60}?) (Kontakt|Contact|Contatto)", text)
    print(lang, found.group(1) if found else "not found", sep=" | ")

heading("BFS asset API: the ThemaKart set's title")
for lang in LANGS:
    meta = json.loads(get(THEMAKART, headers={"Accept-Language": lang}))
    print(lang, meta["description"]["titles"]["main"], sep=" | ")

# 8. The data files: what they hold in the three languages, and the names of places.
heading("Data files")
votes = json.load(open("app/static/data/votes.json", encoding="utf-8"))["votes"]
for field in ("title", "reference", "note"):
    given = [vote[field] for vote in votes if vote[field] is not None]
    complete = sum(all(entry.get(lang) for lang in LANGS) for entry in given)
    print(field, f"{len(given)} of {len(votes)} votes have one, {complete} in all three languages")
days = sorted({vote["date"] for vote in votes if vote["date"].endswith("-01")})
print("votes on the first day of a month:", days or "none")
municipalities = json.load(open("app/static/data/municipalities.json", encoding="utf-8"))
names = [name for canton in municipalities["municipalities"].values() for _, name in canton]
slashed = [name for name in names if "/" in name]
print(f"{len(names)} municipalities, one name each; {len(slashed)} with a slash:", slashed)
print("cantons, by their abbreviations:", list(municipalities["municipalities"]))
