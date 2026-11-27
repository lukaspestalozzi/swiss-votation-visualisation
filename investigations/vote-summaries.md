# Vote summaries

Found while applying `add-vote-summaries` (#18 of `docs/roadmap.md`), on 2026-11-27.

It answers what the change needs before any summary is written:
- where the Federal Council's explanations (the voting booklet) of each of the 44 vote days of
  `votes.json` are published, in German, French and Italian, and in which language each
  document really is;
- what the Chancellery calls the document in French and Italian, and what the law says of it;
- which votes Q reviews, and three sample summaries written by the rules of the change.

It decides nothing: the design of `add-vote-summaries` records the decisions (3, 11 and 14 use
what this file found).

## How to reproduce

```sh
python3 -I investigations/vote-summaries/find_explanations.py /tmp/booklets
```

The script is in `investigations/vote-summaries/`. It uses the standard library and
`pdftotext` (poppler), reads `app/static/data/votes.json`, and downloads the 132 documents into
the directory it is given, outside the repository (113 MB). It asks www.admin.ch and
swissvotes.ch over the network. Its output of 2026-11-27 is
`investigations/vote-summaries/find_explanations.out`: a line per vote day and language, then
the "days" object of `pipeline/vote-summaries.json`.

## 1. Where the explanations are

- **From 2015-06-14 (35 vote days):** www.admin.ch has a page per vote day in each language,
  which links one PDF under an opaque path, `https://www.admin.ch/dam/<lang>/sd-web/<id>/<name>.pdf`.
  The page is reached by the address of before,
  `https://www.admin.ch/gov/<lang>/start/dokumentation/abstimmungen/<yyyymmdd>.html`, which
  redirects to it, or, for 2026-09-27, only by its new slug
  (`/de/volksabstimmung-vom-27-september-2026`, `/fr/votation-populaire-du-27-septembre-2026`,
  `/it/votazione-popolare-del-27-settembre-2026`). The redirect of 2024-03-03 in German lands on
  a page whose slug says 2018 (`/de/volksabstimmung-vom-03-maerz-2018`) but which shows 2024.
- **2016-02-28, French:** every French page of that day (the day's and the four votes') links
  `…/dam/fr/sd-web/kOH6nJzClyOD/Erlaeuterungen_DE_bf.pdf`, which is the German booklet. admin.ch
  has no French one; Swissvotes has a French copy (`https://swissvotes.ch/vote/596.00/brochure-fr.pdf`,
  "Explications du Conseil fédéral"). Q chose the German admin.ch booklet for the French pages
  (design, decision 14).
- **Before 2015-06-14 (9 vote days, 2013-03-03 to 2015-03-08, 25 votes):** both forms of address
  answer 404 in the three languages, and the Chancellery's own vote-day pages
  (`https://www.bk.admin.ch/de/volksabstimmung?date=<yyyy-mm-dd>`) link no booklet. Swissvotes
  keeps copies in German and French, `https://swissvotes.ch/vote/<number>.00/brochure-<de|fr>.pdf`,
  one per vote: each is the whole booklet of its day (those of 567, 568 and 569 have the same 40
  pages, in files that differ byte for byte), so the script takes the copy of the day's lowest
  number. There is no Italian one (`brochure-it.pdf` answers 404). Q chose these, the Italian pages taking the French copy.
- **How the servers answer:** admin.ch answers a `HEAD` with 200. It answered 6 of the 132
  requests of a first, unpaced run with 403 and each of them with 200 when asked again a few
  seconds later; with a pause of one second between requests and a 403 tried again, the second
  run had none. swissvotes.ch answers a `HEAD` with 405 and a `GET` with a redirect to
  `https://swissvotes.ch/attachments/<hash>`, 200, `application/pdf`.
- **The language of each document** was read from the text of its first six pages, by counting
  ten common words of each language: every document is in the language its page names, except
  the French one of 2016-02-28 (German) and the Italian ones before 2015-06-14 (the French copy).

The second run (paced, a 403 tried again): **132 addresses, 0 problems**. The addresses are in
the output file and, as decided, become the "days" of `pipeline/vote-summaries.json`.

| Vote day | Server | Document's language for de / fr / it | Status, type |
|---|---|---|---|
| 2013-03-03 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2013-06-09 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2013-09-22 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2013-11-24 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2014-02-09 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2014-05-18 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2014-09-28 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2014-11-30 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2015-03-08 | swissvotes.ch | de / fr / fr | all 200, application/pdf |
| 2015-06-14 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2016-02-28 | www.admin.ch | de / de / it | all 200, application/pdf |
| 2016-06-05 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2016-09-25 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2016-11-27 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2017-02-12 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2017-05-21 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2017-09-24 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2018-03-04 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2018-06-10 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2018-09-23 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2018-11-25 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2019-02-10 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2019-05-19 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2020-02-09 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2020-09-27 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2020-11-29 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2021-03-07 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2021-06-13 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2021-09-26 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2021-11-28 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2022-02-13 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2022-05-15 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2022-09-25 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2023-06-18 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2024-03-03 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2024-06-09 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2024-09-22 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2024-11-24 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2025-02-09 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2025-09-28 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2025-11-30 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2026-03-08 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2026-06-14 | www.admin.ch | de / fr / it | all 200, application/pdf |
| 2026-09-27 | www.admin.ch | de / fr / it | all 200, application/pdf |

## 2. The document's names, and the law

- **Names.** The documents' own first pages and file names: "Erläuterungen des Bundesrates",
  "Explications du Conseil fédéral" and "Spiegazioni del Consiglio federale" (for example the
  files of 2017-05-21 and 2026-09-27, and the French copy of 2016-02-28). These are the link
  texts of the spec.
- **Federal Act on Political Rights, art. 11 para. 2** (SR 161.1, version of 2022-10-23, read
  from fedlex's file
  `…/eli/cc/1978/688_688_688/20221023/de/html/fedlex-data-admin-ch-eli-cc-1978-688_688_688-20221023-de-html-11.html`):
  "Der Abstimmungsvorlage wird eine kurze, sachliche Erläuterung des Bundesrates beigegeben,
  die auch den Auffassungen wesentlicher Minderheiten Rechnung trägt."
- **Copyright Act, art. 5 para. 1** (SR 231.1, version of 2025-07-01, fedlex's file
  `…/eli/cc/1993/1798_1798_1798/20250701/de/html/fedlex-data-admin-ch-eli-cc-1993-1798_1798_1798-20250701-de-html-7.html`):
  "Durch das Urheberrecht nicht geschützt sind: a. Gesetze, Verordnungen, völkerrechtliche
  Verträge und andere amtliche Erlasse; b. Zahlungsmittel; c. Entscheidungen, Protokolle und
  Berichte von Behörden und öffentlichen Verwaltungen; d. Patentschriften und veröffentlichte
  Patentgesuche." The explanations are not named; that they are "Berichte von Behörden" is an
  inference, not a ruling found.
- **admin.ch's terms** (`https://www.admin.ch/gov/de/start/rechtliches.html`, section
  "Copyright"): the rights in the content belong to the federal authorities, and reproducing it
  needs their written consent beforehand.
- **What follows for the change:** the summaries are written in the site's own words and the
  booklets are linked, not copied, so neither the uncertain reading of art. 5 nor the terms
  stand in the way. A summary does not take over a sentence of the booklet word for word.

## 3. The sample, and three summaries

Every booklet opens with a page "Darüber wird abgestimmt" ("Su che cosa si vota?") of three to
five sentences per vote, and each vote's part with "In Kürze" ("En bref", "In breve"), whose
paragraph "Die Initiative" / "Die Vorlage" says what changes. The summaries are written from
these, never from "Argumente" or the recommendation.

**The sample Q reviews (19 votes):** 5670 (mandatory referendum, 2013), 5800 (2014, against mass
immigration), 5950 (optional referendum, 2015), 5960 and 5970 (2016), 6150 (2017), 6240 (2018),
6280 (2019), 6360 (2020), 6380 and 6500 (2021), 6600 (2022), 6630 (2023), 6650 (2024, 13th AHV
pension), 6790 (2025), 6821, 6822, 6823 and 6860 (2026). Every year from 2013, every kind of
vote, the two vote days on Swissvotes' copies (5670, 5800) and the most disputed votes.

**Three samples**, the German ones after the humanizer pass (one passive turned active), with
their length in characters:

**5960, «Für Ehe und Familie – gegen die Heiratsstrafe» (2016-02-28)**

- de (361): Die Initiative will in der Verfassung festhalten, dass Ehepaare gegenüber anderen Lebensformen nicht benachteiligt werden dürfen, namentlich bei den Steuern und den Sozialversicherungen. Sie definiert die Ehe als die auf Dauer angelegte, gesetzlich geregelte Lebensgemeinschaft von Mann und Frau. Ein Ehepaar soll steuerlich eine Wirtschaftsgemeinschaft bilden.
- fr (360): L’initiative veut inscrire dans la Constitution que les couples mariés ne peuvent pas être pénalisés par rapport à d’autres modes de vie, notamment en matière d’impôts et d’assurances sociales. Elle définit le mariage comme l’union durable et réglementée par la loi d’un homme et d’une femme. Le couple marié forme une communauté économique sur le plan fiscal.
- it (367): L’iniziativa vuole sancire nella Costituzione che il matrimonio non sia svantaggiato rispetto ad altri modi di vita, segnatamente sotto il profilo fiscale e delle assicurazioni sociali. Definisce il matrimonio come la durevole convivenza, disciplinata dalla legge, di un uomo e di una donna. Dal punto di vista fiscale i coniugi costituiscono una comunione economica.

**6650, «Für ein besseres Leben im Alter (Initiative für eine 13. AHV-Rente)» (2024-03-03)**

- de (293): Die Initiative will die Altersrenten der AHV um eine 13. Monatsrente pro Jahr erhöhen. Die höchste Altersrente steigt damit für Einzelpersonen um 2450 auf 31 850 Franken im Jahr, für Ehepaare um 3675 auf 47 775 Franken. Die Ergänzungsleistungen dürfen wegen der 13. Rente nicht gekürzt werden.
- fr (335): L’initiative veut ajouter chaque année une 13e rente mensuelle aux rentes de vieillesse de l’AVS. La rente annuelle maximale augmente ainsi de 2450 francs, à 31 850 francs, pour une personne seule et de 3675 francs, à 47 775 francs, pour un couple marié. La 13e rente ne doit pas entraîner de réduction des prestations complémentaires.
- it (345): L’iniziativa chiede di aggiungere ogni anno una tredicesima mensilità alle rendite di vecchiaia AVS. La rendita annua massima aumenta così di 2450 franchi, fino a 31 850 franchi, per le persone sole e di 3675 franchi, fino a 47 775 franchi, per le coppie sposate. La tredicesima non deve comportare una riduzione delle prestazioni complementari.

**6823, the tie-break question of 2026-03-08**

- de (231): Die Stichfrage entscheidet, ob die Bargeldinitiative oder der Gegenentwurf in Kraft tritt, falls Volk und Stände beiden zustimmen. Beantworten darf sie auch, wer die ersten beiden Fragen mit Nein beantwortet oder leer gelassen hat.
- fr (279): La question subsidiaire détermine si l’initiative pour l’argent liquide ou le contre-projet entre en vigueur au cas où le peuple et les cantons acceptent les deux textes. On peut y répondre même si l’on a répondu non aux deux premières questions ou si on les a laissées en blanc.
- it (248): La domanda risolutiva stabilisce se entra in vigore l’iniziativa denaro contante oppure il controprogetto, qualora Popolo e Cantoni accettino entrambi. Si può rispondere anche se si è risposto no alle prime due domande o le si è lasciate in bianco.

For 6650 the booklet's "In Kürze" also names the cost (about 4.1 billion francs in the first
year) and that the initiative leaves its funding open; the samples leave both out, as they
were the opponents' main arguments. A first French draft of 6650 said the
maximum pension went "de 2450 à 31 850 francs"; it rises by 2450 to 31 850, corrected.

**Q's answer, 2026-11-27:** the three samples, their rules and tone are approved; a summary
keeps to what the proposal changes and leaves out costs and funding where they were the
campaign's arguments, even when the booklet's "In Kürze" names them.

## 4. The comparison's size (task 4.4)

The comparison holds, in each language, the summary, address and link text of the 124 votes it
offers, in its page and its `__data.json`. Measured on the build of 2026-11-27 (`pnpm run build`,
then `gzip -9`):

| | Bytes | gzip |
|---|---|---|
| `de/compare/index.html`, with the summaries | 128,723 | 29,122 |
| `de/compare/__data.json`, with the summaries | 97,411 | 27,586 |
| What the summaries add, German (124 × text, address, label as JSON) | 63,599 | 17,912 |
| French | 67,059 | 18,018 |
| Italian | 64,616 | 17,517 |

The design estimated about 50 KB and 15 to 20 KB with gzip; the task's bound was 25 KB with gzip.
A vote's page holds its own summary only, some 300 to 450 bytes.

## 5. Q's review of the sample (task 3.3)

On 2026-11-27 Q approved the 19 summaries of section 3 with two edits Claude proposed, made in
all three languages: 5970 keeps only "unabhängig von der Höhe der Strafe" (the initiative's own
words) and drops "der Schwere der Tat", the opponents' framing; 6822 drops "weitgehend
unverändert", which read as "it changes almost nothing".
