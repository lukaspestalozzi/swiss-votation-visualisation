# Languages

Found while proposing `add-interface-languages` (#9 of `docs/roadmap.md`), on 2026-11-17.

It answers what #9 needs from public sources:
- the official French and Italian terms for what the screen names: the kinds of vote, the
  majorities, the verdicts, the figures, the Swiss abroad, the parties, the offices and their
  publications;
- what the data files already hold in the three languages;
- how places are named;
- how French and Italian write a date.

It decides nothing: the design of `add-interface-languages` records the decisions.

## How to reproduce

```sh
python3 investigations/languages/official_terms.py
```

The script is in `investigations/languages/`. It uses the standard library only and reads the
committed data files. It asks these sources over the network, and writes nothing:
- the Federal Chancellery's linked data (LINDAS, `lindas.admin.ch/query`);
- fedlex: its SPARQL endpoint and its file of the Federal Constitution;
- the BFS's STAT-TAB;
- the BFS's register application (`agvchapp.bfs.admin.ch`);
- the BFS's asset API.

Its output on 2026-11-17 gave every value below.

## 1. The terms of a vote

The Chancellery's linked data names the kinds of vote, the verdicts and the majorities in the
three languages (`typologie`, `ergebnis`, `ergebnisDetail` of
`politics.ld.admin.ch/political-rights/popular-vote/`).

| The screen's German | French | Italian | Source |
|---|---|---|---|
| Obligatorisches Referendum | Référendum obligatoire | Referendum obbligatorio | `typologie/3` |
| Fakultatives Referendum | Référendum facultatif | Referendum facoltativo | `typologie/1` |
| Volksinitiative | Initiative populaire | Iniziativa popolare | `typologie/4` |
| Gegenentwurf | Contre-projet | Controprogetto | `typologie/2` |
| Stichfrage | Question subsidiaire | Domanda risolutiva | `typologie/stichfrage` |
| Volksmehr | majorité du peuple | maggioranza del popolo | `ergebnisDetail/4` |
| Ständemehr | majorité des cantons | maggioranza dei Cantoni | `ergebnisDetail/1` and `/2` |
| angenommen, abgelehnt | accepté, rejeté ("Le projet a été accepté") | accettato, respinto ("L'oggetto è stato accettato") | `ergebnis/1` and `/2` |
| Erwahrung (erwahrt) | validation (validé) | accertamento (accertato) | `ergebnis/4`: "Validation en préparation", "Accertamento in preparazione" |

- **"Volksinitiative mit Gegenentwurf"** is the app's own kind, not one of the Chancellery's. Its
  French and Italian follow from the two terms: "Initiative populaire avec contre-projet",
  "Iniziativa popolare con controprogetto".
- **The Federal Constitution, art. 139b** (fedlex, version of 2024-03-03), names the tie-break
  question as the Chancellery does: "question subsidiaire", "domanda risolutiva". Its French
  para. 3 counts "la majorité des **voix des cantons**". The BFS's Italian title of the one
  tie-break question in the data, vote 6823, says otherwise: "Iniziativa denaro contante e
  controprogetto: domanda sussidiaria". It is a title of the data, shown as the BFS gives it.
- **The Federal Constitution, art. 142** names a canton's vote and the half votes:
  - French, para. 3–4: "Le résultat du vote populaire dans un canton représente la **voix** de
    celui-ci." and "… comptent chacun pour une **demi-voix**."
  - Italian, para. 3–4: "L'esito della votazione popolare nel Cantone vale come **voto del
    Cantone**." and "… dispongono di un **mezzo voto** ciascuno."
  - The Chancellery's linked data names its figures "Votes des cantons oui" and "Voto dei
    Cantoni sì" (`staendeJaText`).
  - So "Standesstimmen" is "voix des cantons" after the Constitution (art. 139b and 142), or
    "votes des cantons" after the linked data, and "voti dei Cantoni" after both.

## 2. The names of the figures

| The screen's German | French | Italian | Source |
|---|---|---|---|
| Ja-Anteil | Pourcentage de oui | Percentuale di sì | LINDAS, `jaAnteil` |
| Stimmbeteiligung | Participation | Partecipazione | LINDAS, `stimmbeteiligung` |
| Ja, Nein (the votes) | Oui, Non | – | STAT-TAB `px-x-1703030000_101`, French |

STAT-TAB answers HTTP 400 for the Italian description of the table of votes. The Italian "Sì" and
"No" have no source here.

## 3. The Swiss abroad

The Swiss Abroad Act (SR 195.1, fedlex `eli/cc/2015/653`) names them in its short title:
- German: "Auslandschweizergesetz";
- French: "Loi sur les **Suisses de l'étranger**";
- Italian: "Legge sugli **Svizzeri all'estero**".

The screen's German pairs the forms ("Auslandschweizerinnen und Auslandschweizer"). The pairs in
French and Italian ("Suissesses et Suisses de l'étranger", "Svizzere e Svizzeri all'estero") have
no source here.

## 4. The parties

The characteristics' party strengths come from STAT-TAB `px-x-1702020000_105`. Its parties:
- German: FDP, Mitte, SP, SVP, GLP, Grüne, …, CVP, BDP, Übrige;
- French: PLR, Centre, PS, UDC, PVL, Verts, …, PDC, PBD, Autres.

It answers HTTP 400 for Italian. The Italian names come from two other sources of the
Confederation, in LINDAS.

**The Chancellery's register of parties** (`political-party-register`), short forms (de, fr, it):
- FDP, PLR, PLR;
- SP, PS, PS;
- SVP, UDC, UDC;
- GLP, PVL, PVL.

The Greens have an Italian short form only, "I Verdi". The Centre has none, only names: "Die
Mitte", "Le Centre", "il Centro".

**The parliament's parties** (`politics.ld.admin.ch/party/`), short names (de, fr, it):
- CVP, PDC, PPD (party 14);
- BDP, PBD, PBD (party 1551);
- GRÜNE, VERT-E-S, VERDI (party 20).

Its name of the Centre in Italian is "Alleanza del Centro" (party 1586), where the register's is
"il Centro".

The sources differ in two places:
- **the Greens:** STAT-TAB writes "Grüne" and "Verts"; the register and the parliament write
  "GRÜNE", "VERT-E-S", "VERDI";
- **the Centre in Italian:** "il Centro" in the register, "Alleanza del Centro" in the parliament.

## 5. The offices and their publications

| German | French | Italian | Source |
|---|---|---|---|
| Bundesamt für Statistik (BFS) | Office fédéral de la statistique (OFS) | Ufficio federale di statistica (UST) | LINDAS, `ld.admin.ch/office/II.1.7` |
| Bundeskanzlei (BK) | Chancellerie fédérale (ChF) | Cancelleria federale (CaF) | LINDAS, `ld.admin.ch/FCh` |
| swisstopo | swisstopo | swisstopo | LINDAS, `ld.admin.ch/office/IV.1.5a` |
| Amtliches Gemeindeverzeichnis der Schweiz | Répertoire officiel des communes de Suisse | Elenco ufficiale dei Comuni della Svizzera | the register application, `agvchapp.bfs.admin.ch/{de,fr,it}` |
| Kartengeometrien ThemaKart – Set 2026 | Géométries de base ThemaKart – Set 2026 | Geometrie di base ThemaKart – Set 2026 | BFS asset API, asset 36390072 |
| Nationalratswahlen | Elections au Conseil national | Elezione del Consiglio nazionale | STAT-TAB `px-x-1702020000_105` (fr); LINDAS, `voting_dates/ergebnis` (it) |
| BBl (Bundesblatt) | FF | FF | the data files' references (`votes.json`) |

What the screen also names, from STAT-TAB's French descriptions; STAT-TAB gives no Italian for
these tables:
- the population's table gives the categories "Étranger" (fr) and "Straniera" (it);
- the census of 2000 gives the main languages "Allemand", "Français", "Italien", "Romanche";
- the farm survey gives the cattle as "Bovins".

The names of the surveys in French and Italian have no source here: "Volkszählung 2000" and
"Landwirtschaftliche Strukturerhebung".

## 6. Dates

- The data has no vote on the first day of a month (none of the 125 votes).
- For the first day of a month, fedlex's footnotes of the Constitution write "1er déc. 2009"
  (French) and "1° dic. 2009" (Italian), where the German is "1. Dez. 2009".
- The month names are lower case in both languages, in the Constitution's footnotes: "fév.",
  "sept.", "feb.", "set.".
- Federal French writes a colon without a space before it: "Sont soumises au vote du peuple et
  des cantons:" (art. 140). The data's French titles quote with « » and no inner spaces:
  "«Pour le couple et la famille – Non à la pénalisation du mariage»".

## 7. The data files

- **Vote titles:** all 125 votes have a title in German, French and Italian.
- **References:** all 117 references are in all three.
- **Notes:** all 4 notes of the Chancellery are in all three.

So the data needs nothing new: `vote-data` already writes the three languages, and the screen
shows only the German.

Places have one name each, the same in every language:
- **Municipalities:** the list of 2026 has 2,110 municipalities, each with one official name.
  11 names hold two languages with a slash: Biel/Bienne, Vaz/Obervaz, Lantsch/Lenz, Albula/Alvra,
  Ilanz/Glion, Domat/Ems, Celerina/Schlarigna, Sils im Engadin/Segl, Breil/Brigels,
  Disentis/Mustér, Bosco/Gurin.
- **Cantons:** the screen names a canton by its abbreviation (ZH, BE, … JU): in the table of the
  cantons and after a municipality's name. The abbreviations are the same in every language.

## 8. The size of the site

The build of 2026-11-17 (`app/build/swiss-votation-visualisation`, 23 MB):
- `votes/` takes 14 MB on disk: 125 pages, each an `index.html` of about 48 KB and a
  `__data.json` of about 64 KB for the vote of 2016-02-28;
- `data/` takes 9.2 MB;
- `_app/` takes 212 KB.

A page per language triples `votes/`, to about 40 MB, and leaves `data/` as it is. That is well
inside GitHub Pages' limit of 1 GB per site.
