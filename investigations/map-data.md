# Map data

Found while proposing `add-result-map` (#6 of `docs/roadmap.md`), on 2026-11-15, from the live
sources. It answers what the roadmap leaves open for the map's data: where the boundaries of the
municipalities, the cantons and the lakes come from, at which level of detail, how they follow
the list of municipalities, and how far apart the colours of the map are. It decides nothing:
the design of `add-result-map` records the decisions.

Words used here: the **register** is the BFS register of municipalities, which the pipeline
already reads for the list; **ThemaKart** is the BFS's yearly set of map geometries for
thematic maps; **K4** and **G1** are two levels of simplification of the BFS's boundaries, K4
for maps at 1:500,000 to 1:5 million (made at 1:2 million), G1 for 1:300,000 to 1:600,000;
**LV95** is the Swiss coordinate system (EPSG:2056), in metres.

## How to reproduce

The scripts are in `investigations/map-data/`. Two read shapefiles and need the package pyshp,
which `uv` provides for the run; the others use Python's standard library only. They reuse
`sources.py` and `readers.py` of `investigations/data-sources/`. The downloads are about 20 MB
and stay outside the repository.

```sh
cd investigations/map-data
uv run --no-project --with pyshp==3.1.6 python check_map_sources.py /path/outside/the/repository
python3 check_colours.py
python3 municipal_figures.py /path/outside/the/repository
```

| File | What |
|------|------|
| `check_map_sources.py` | The register's boundaries and the ThemaKart set 2026 against the register's list of 2026-01-01: counts, coordinate system, how the two sources differ, the lakes, the size of the map. |
| `check_colours.py` | The distances between the colours of the map, under normal vision and simulated red-green colour vision deficiency. No download. |
| `municipal_figures.py` | The yes and no votes and the colour class of the municipalities the specs of the map name, from the BFS vote-day files. |

"Output" at the end of this file is what these scripts printed on 2026-11-15.

## Sources

| Source | Address | What it gives | Publisher, terms |
|--------|---------|---------------|------------------|
| Register boundaries | `https://www.agvchapp.bfs.admin.ch/api/boundaries/divisions?division=<Commune\|Canton\|Country>&resolution=<K4\|G1>&dissolve=true&date=<dd-mm-yyyy>&format=<shp\|geojson\|gpkgzip>` (behind the page "Geometrien - Visualisierung und Download" of the register) | The boundaries of the municipalities, cantons or the country on any date up to today: as a shapefile in LV95, as GeoJSON in WGS84. A municipality's number is `GDENR`, its name `GDENAME`, its canton `KTKZ`. | BFS. The pages state no terms of use. |
| ThemaKart set 2026 | BFS asset 36390072, order number `mb-x-00.07.01.01-26`, `https://dam-api.bfs.admin.ch/hub/api/dam/assets/36390072/master` (found through `https://dam-api.bfs.admin.ch/hub/api/dam/assets?orderNr=<order number>`), published 2026-02-02 | A ZIP of K4 shapefiles in LV95: municipalities, districts, cantons and the country on several dates, the lakes (`seenyyyymmdd11`, more than 500 ha; `seenyyyymmdd22`, 195 to 499 ha; "valid for all years"), rivers, the "Gemeinden (Politik)", and its description (`THK-Basisgeometrien_CH_K4_d_2026.pdf`). The set of 2025 is order number `mb-x-00.07.01.01-25`, published 2025-02-14. | BFS. The asset's terms: OPEN-BY, "Open use - Must provide the source". The PDF in the set still has the older licence text: maps made from it show "Kartengrundlage: © BFS" with the year of the set, and the geometry may not be changed without a written agreement. |

## Answers

### 1. The register gives the boundaries of exactly the list

On 2026-01-01 the register's K4 boundaries of the municipalities are 2,110 shapes with 2,110
different numbers, exactly the municipalities of the register's list of that date: none
missing, none extra. Its G1 boundaries have 2,113 shapes: the 2,110 and three areas that belong
to no municipality (2391 Staatswald Galm, 5391 C'za Cadenazzo/Monteceneri, 5394 C'za
Capriasca/Lugano). The cantons are 26 shapes. The shapefiles are in LV95; GeoJSON is in WGS84.
The register refuses a date in the future (HTTP 400, "La date 'Date' ne doit pas être dans le
futur."), so the boundaries of a new list exist from its reference date on.

### 2. ThemaKart has the same municipalities, simplified differently

ThemaKart's municipalities of 2026-01-01 (`polg20260101`, "Gesamtfläche") are the same 2,110
numbers. Their outlines are another K4 simplification than the register's: 852 municipalities
have the same corners within 1 m; for half of them the corner farthest from the other outline
is within 0.8 m, for 90% within 785 m, and the largest offsets are 2.5 to 2.9 km (6119
Turtmann-Unterems, 6292 St. Niklaus, 6153 Monthey). Drawn side by side at about nine times the
whole map, the two are hard to tell apart.

### 3. The lakes are holes, and some reach past the border

In both sources, the municipalities, the cantons and the country leave the lakes out: a point
in the Zugersee, the Zürichsee, the Lac de Neuchâtel, the Lac Léman or the Bodensee lies in no
municipality. The register's country has 2 outer rings and 19 holes of 689 km²; the border
lakes (Lac Léman, Bodensee) lie outside its outer rings, since the border runs along their
Swiss shore in this generalisation. Neither source cuts its lakes into the municipalities' share.

ThemaKart has 37 lakes: 23 of more than 500 ha and 14 of 195 to 499 ha (its description says
22 and 14). They are whole lakes: 535 of their 2,000 corners lie outside the country's outer
rings, more than 1 km outside in the Bodensee, the Lac Léman, the Lago Maggiore and the Lago di
Lugano; the Lago Maggiore reaches 28.9 km past the border. The register has no lakes.

### 4. The municipalities with a shared ballot box

ThemaKart's "Gemeinden (Politik)" of 2026-01-01 (`voge20260101`) are 2,105 shapes: the
municipalities of the list without 389, 408, 535, 629 and 877, whose votes are counted together
with a neighbour's (its description: "Gemeinden mit gemeinsamer Urne"). These are the five
municipalities without a result of the votes since 2021 (spec `municipalities`). The layer
exists only for 2025-01-01, 2025-04-06 and 2026-01-01, not for the seven municipalities without
a result of 2016.

### 5. The size of the map

The register's municipalities and cantons with ThemaKart's lakes, as SVG paths in JSON, with
the coordinates rounded to the metre: 367 KB, 163 KB gzipped.

### 6. The colours

`check_colours.py` gives the distances (Delta E, OKLab times 100) between the colours of the
map. The classes are those of the side with more votes: 50 to 60%, 60 to 70%, 70 to 80%, 80% or
more.

| Pair | Normal vision | Red-green deficiency |
|------|---------------|----------------------|
| The same class of yes and of no, classes 1 to 4 | 14.7, 20.3, 22.4, 19.4 | 6.9, 9.4, 10.4, 9.3 |
| The same, with ColorBrewer's Reds and Greens, for comparison | 15.1, 26.9, 32.4, 27.3 | 8.1, 5.8, 5.7, 3.5 |
| Neighbouring classes of one side | 11.4 to 13.1 | 10.1 to 12.9 |
| As many yes as no, against class 1 of no and of yes | 12.8, 13.0 | 11.1, 7.4 |
| Lake, against classes 1 and 2 of no and of yes and the neutral colour | 12.2 to 18.8 | 7.8 to 17.4 |

The colours: no `#fbbea3`, `#e5946f`, `#c2673b`, `#934319`; yes `#92dfd0`, `#4bc1ad`,
`#009c86`, `#007260`; as many yes as no `#f0efec`; lake `#9fb8e8`. Delta E of 8 or more tells
two colours apart; 6 to 8 does so only with a second cue, such as the figures shown on
pointing.

### 7. Municipal figures

From the BFS vote-day files (`municipal_figures.py`):

| Vote | Municipality | Yes | No | Yes share | Colour class |
|------|--------------|-----|----|-----------|--------------|
| 5960, 2016-02-28 | 261 Zürich | 46,565 | 99,614 | 31.8548% | no, 60 to 70% |
| 5960 | 351 Bern | 15,928 | 41,756 | 27.6125% | no, 70 to 80% |
| 5960 | 1 Aeugst am Albis | 432 | 550 | 43.9919% | no, 50 to 60% |
| 5960 | 946 Wachseldorn | 95 | 25 | 79.1667% | yes, 70 to 80% |
| 5960 | 1703 Hünenberg | 2,111 | 2,111 | 50.0000% | as many yes as no |
| 5960 | 29 Flurlingen | 272 | 408 | 40.0000% | no, 60 to 70% (exactly 60% no) |
| 5960 | 2702 Bettingen | 324 | 216 | 60.0000% | yes, 60 to 70% (exactly 60% yes) |
| 5960 | 389 Meienried | no entry | | | without a result |
| 6650, 2024-03-03 | 6745 Les Enfers | 61 | 3 | 95.3125% | yes, 80% or more |
| 6650 | 1211 Isenthal | 39 | 161 | 19.5000% | no, 80% or more |
| 6650 | 5761 Romainmôtier-Envy | 200 | 50 | 80.0000% | yes, 80% or more (exactly 80%) |

## Not verified

- The terms of use of the register's boundaries; the pages state none.
- Why the two K4 simplifications differ, and which of the two the BFS keeps up to date.
- When the BFS vote-day files switch to the list of a new year, and so whether a ThemaKart set
  is published before the files need it.
- Which holes of the municipalities are lakes that ThemaKart does not have (smaller than
  195 ha).

## Output

`check_map_sources.py`:

```text
register list of 2026-01-01: 2110 municipalities
register boundaries K4 Commune 2026-01-01: 2110 shapes, fields ['GDENAME', 'GDEHISTID', 'GDENR', 'KTNAME', 'KTNR', 'KTKZ'], PROJCS["CH1903+ / LV95", GEOGCS["CH1903+
  numbers: 2110 different; not on the list: []; of the list without a shape: []
  points: 28487
register boundaries K4 Canton 2026-01-01: 26 shapes, ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH']
register boundaries G1 Commune 2026-01-01: 2113 shapes; not on the list: [(2391, 'Staatswald Galm'), (5391, "C'za Cadenazzo/Monteceneri"), (5394, "C'za Capriasca/Lugano")]
register boundaries of 2027-01-01: HTTP 400, {'Date': ["La date 'Date' ne doit pas être dans le futur."]}
ThemaKart set 2026: asset 36390072, 'Kartengeometrien ThemaKart - Set 2026', published 2026-02-02T07:30:00Z, terms OPEN-BY (Open use - Must provide the source)
  municipalities: 2110 shapes, 27391 points, PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903
  cantons: 26 shapes, 5839 points, PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903
  lakes 1: 23 shapes, 1680 points, PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903
  lakes 2: 14 shapes, 320 points, PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903
  voting: 2105 shapes, 27363 points, PROJCS["CH1903+_LV95",GEOGCS["GCS_CH1903
  municipalities: not on the list: []; of the list without a shape: []
  municipalities with the same points as the register's, within 1 m: 852 of 2110
  largest offset of a corner, 50% of the municipalities within: 0.8 m
  largest offset of a corner, 90% of the municipalities within: 785.4 m
  largest offsets: [(6119, 2505), (6292, 2505), (6153, 2926)]
  lakes: 37: Aegerisee, Alpnachersee, Baldeggersee, Bielersee, Bodensee, Brienzersee, Greifensee, Grimselsee, Hallwilersee, Klöntalersee, Lac Léman, Lac d'Emosson, Lac de Joux, Lac de Mauvoisin, Lac de Neuchâtel, Lac de la Gruyère, Lac des Dix, Lago Maggiore, Lago di Lugano, Lago di Poschiavo, Lauerzersee, Lej da Segl, Lej da Silvaplana, Lungernsee, Murtensee, Pfäffikersee, Sarnersee, Schiffenensee, Sempachersee, Sihlsee, Thunersee, Vierwaldstettersee, Walensee, Wohlensee, Wägitalersee, Zugersee, Zürichsee
register boundaries K4 Country 2026-01-01: 2 outer rings and 19 holes of 689 km²
  a point in the Zugersee (2679356, 1218905): in a ThemaKart lake True; in a register municipality False; in a ThemaKart municipality False; inside the country's outer rings True
  a point in the Zürichsee (2702388, 1232337): in a ThemaKart lake True; in a register municipality False; in a ThemaKart municipality False; inside the country's outer rings True
  a point in the Lac de Neuchâtel (2554282, 1194057): in a ThemaKart lake True; in a register municipality False; in a ThemaKart municipality False; inside the country's outer rings True
  a point in the Lac Léman (2530000, 1145000): in a ThemaKart lake True; in a register municipality False; in a ThemaKart municipality False; inside the country's outer rings False
  a point in the Bodensee (2745000, 1275000): in a ThemaKart lake True; in a register municipality False; in a ThemaKart municipality False; inside the country's outer rings False
  lake corners outside the country's outer rings: 535 of 2000, more than 1 km outside in ['Bodensee', 'Lac Léman', 'Lago Maggiore', 'Lago di Lugano']; farthest 28.9 km from the nearest corner of the border (Lago Maggiore)
  voting municipalities ('Gemeinden (Politik)'): 2105; of the list without one: [389, 408, 535, 629, 877]
the map as SVG paths in JSON, to the metre: 367 KB, gzipped 163 KB
```

`check_colours.py`:

```text
The same class of yes and of no (50-60%, 60-70%, 70-80%, 80% or more):
  map, class 1                     #fbbea3 #92dfd0  normal  14.7  red-green deficiency   6.9
  map, class 2                     #e5946f #4bc1ad  normal  20.3  red-green deficiency   9.4
  map, class 3                     #c2673b #009c86  normal  22.4  red-green deficiency  10.4
  map, class 4                     #934319 #007260  normal  19.4  red-green deficiency   9.3
  ColorBrewer Reds/Greens, class 1 #fcae91 #c7e9c0  normal  15.1  red-green deficiency   8.1
  ColorBrewer Reds/Greens, class 2 #fb6a4a #74c476  normal  26.9  red-green deficiency   5.8
  ColorBrewer Reds/Greens, class 3 #de2d26 #31a354  normal  32.4  red-green deficiency   5.7
  ColorBrewer Reds/Greens, class 4 #a50f15 #006d2c  normal  27.3  red-green deficiency   3.5
Neighbouring classes on one side:
  no, classes 1 and 2              #fbbea3 #e5946f  normal  11.4  red-green deficiency  11.0
  no, classes 2 and 3              #e5946f #c2673b  normal  13.1  red-green deficiency  12.8
  no, classes 3 and 4              #c2673b #934319  normal  13.1  red-green deficiency  12.9
  yes, classes 1 and 2             #92dfd0 #4bc1ad  normal  11.4  red-green deficiency  10.1
  yes, classes 2 and 3             #4bc1ad #009c86  normal  11.9  red-green deficiency  11.9
  yes, classes 3 and 4             #009c86 #007260  normal  12.8  red-green deficiency  12.6
The neutral colour and the lakes against the classes:
  as many yes as no                #f0efec #fbbea3  normal  12.8  red-green deficiency  11.1
  as many yes as no                #f0efec #92dfd0  normal  13.0  red-green deficiency   7.4
  lake                             #9fb8e8 #fbbea3  normal  16.1  red-green deficiency  12.1
  lake                             #9fb8e8 #e5946f  normal  18.0  red-green deficiency  16.2
  lake                             #9fb8e8 #92dfd0  normal  12.2  red-green deficiency  10.0
  lake                             #9fb8e8 #4bc1ad  normal  13.2  red-green deficiency   7.8
  lake                             #9fb8e8 #f0efec  normal  18.8  red-green deficiency  17.4
```

`municipal_figures.py`:

```text
20160228 vote 5960: Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»
  261 Zürich: yes 46,565 no 99,614, yes share 31.8548%, no, class 2 (60-70% no)
  351 Bern: yes 15,928 no 41,756, yes share 27.6125%, no, class 3 (70-80% no)
  1 Aeugst am Albis: yes 432 no 550, yes share 43.9919%, no, class 1 (50-60% no)
  946 Wachseldorn: yes 95 no 25, yes share 79.1667%, yes, class 3 (70-80% yes)
  1703 Hünenberg: yes 2,111 no 2,111, yes share 50.0000%, as many yes as no
  29 Flurlingen: yes 272 no 408, yes share 40.0000%, no, class 2 (60-70% no)
  2702 Bettingen: yes 324 no 216, yes share 60.0000%, yes, class 2 (60-70% yes)
  389: no entry
20240303 vote 6650: Volksinitiative «Für ein besseres Leben im Alter (Initiative für eine 13. AHV-Rente)»
  6745 Les Enfers: yes 61 no 3, yes share 95.3125%, yes, class 4 (80% or more yes)
  1211 Isenthal: yes 39 no 161, yes share 19.5000%, no, class 4 (80% or more no)
  5761 Romainmôtier-Envy: yes 200 no 50, yes share 80.0000%, yes, class 4 (80% or more yes)
```
