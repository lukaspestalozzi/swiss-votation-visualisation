# Proposal

## Why

The site has the 21 characteristics the predecessor had: the population, the parties, the
languages, the area and the cattle. A visitor who asks how municipalities with many graduates, a
Catholic majority, many home owners or many jobs voted cannot set such a limit. #13 of
`docs/roadmap.md`, `add-more-characteristics`, adds characteristics beyond the predecessor's. It
settles what the roadmap leaves open for it: which ones. The roadmap names income, education,
religion and the urban or rural type.

`investigations/more-characteristics.md` gives the facts:
- **Education and religion exist per municipality in the census of 2000 only.** Both tables are
  complete and whole for all 2,110 municipalities of the votes' list. The surveys since 2010 are
  samples, published by canton, district and city.
- **The census of 2000 also gives housing:** who lives in each occupied dwelling, and the kinds of
  building.
- **Three yearly sources of the BFS hold up:** the inhabitants born abroad (complete), the jobs by
  sector (the number of all jobs nearly complete; a sector's count withheld in about 100
  municipalities a year), and the farms with their organic farmland.
- **The urban or rural type is a category**, 509 urban, 580 intermediate and 1,021 rural
  municipalities: a limit with two bounds does not fit it.
- **Income comes from the Federal Tax Administration**, whose server refuses the pipeline's
  client. Its files were not read.
- **STAT-TAB has nothing per municipality** on land use, vehicles, social assistance or taxes.

## What Changes

- **14 new characteristics**, 35 in all (Q):
  - **the population:** the share of inhabitants born abroad, of the newest year before the vote
    that its own table gives, as the cattle (Q);
  - **religion in 2000:** the shares Evangelical Reformed, Roman Catholic and without a religious
    affiliation;
  - **education in 2000:** of those who named a level, the share with a university or higher
    vocational degree, and the share with compulsory school or no education;
  - **housing in 2000:** the share of occupied dwellings lived in by their owner, and the share
    of single-family houses among the buildings with dwellings;
  - **jobs:** the jobs per 100 inhabitants at the end of the last year before the vote, and the
    shares of the primary, the secondary and the tertiary sector among them;
  - **farming:** the farms per 1,000 inhabitants, and the organic share of the farmland, of the
    year of the cattle.
- **A characteristic may lack a figure for other reasons than an election:**
  - a sector's share where the BFS withholds a count, also for a municipality made of several
    when one part's count is withheld;
  - the organic share where a municipality has no farmland.

  Such a municipality reads "keine Angabe", and a narrowed limit sets it aside, as today.
- **Hérémence keeps its education figures** (Q), though only 16 of its 1,093 people past school
  age named a level in 2000.
- **The names say what is counted** (Q), in words that read without their heading: "Arbeitsplätze
  je 100 Einwohner", not the table's "Beschäftigte".
- **The panel beside the map has eight groups** instead of four: religion, education, housing and
  jobs get a group each, headed with the date of their figures. A line of another year than its
  group's heading names its year.
- **The list "Merkmal hinzufügen" groups its 35 entries** under the panel's headings, without
  their dates (Q).
- **The address knows 14 more keys**, the same in every language.
- **A link with all 35 limits may take 170 ms** for the frame after it opens (Q): the same
  allowance per limit as the 100 ms of 21 limits, which stay for a link with up to 21.
- **The guide and the panel name the new source** (STATENT), say which figures apply to a vote,
  and that a sector's share or an organic share can lack a figure.
- **The pipeline reads six more tables** of STAT-TAB, and more of the farms table it reads for
  the cattle. One of the six is on a list of municipalities it did not use so far (2024-01-01).
  Each gets the checks the existing tables have: the list it gives, whole numbers, sums. A count the BFS withholds is written as none, never as zero.
- **The data file of the characteristics grows** from 1.36 MB to about 2.67 MB, about 981 KB
  with gzip, and stays one file (Q).
- **The investigation:** `investigations/more-characteristics.md`, with its scripts.

## Non-goals

- **No income** (Q): it stays open on the roadmap until it is clear whether a script may download
  the Federal Tax Administration's files.
- **No urban or rural type and no other category** (Q): language region, type of municipality,
  mountain areas. A limit on a category is another control and its own change.
- **No turnout at National Council elections** (Q), though the source holds up.
- **No farmland as a share of the area:** a farm's land counts where the farm is, so it exceeds
  the area in up to 39 municipalities.
- **No rule for a municipality with few answers** in the census (Q).
- **No splitting of the data file** by year or by vote day (Q).
- **No change to the calculation**, to the limits' sliders, or to the comparison page: they take
  the new characteristics from their definitions.
- **No newer figures for religion, education or housing:** none exist per municipality.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `characteristics`: 35 characteristics instead of 21, each in a group; the new figures and how
  each is computed; which of them apply to a vote; the lists, the whole numbers and the sums the
  pipeline checks for the new tables; a count the source withholds; the years in the data file.
- `limits`: the list "Merkmal hinzufügen" offers 35 characteristics under headings.
- `result-map`: the panel shows 35 characteristics in eight groups, writes two of them with one
  decimal, and names one more source.
- `share-link`: the keys of the 14 new characteristics; the budget of a link with all 35 limits.
- `reading-guide`: which figures apply to a vote, which tracks grow by equal factors, where a
  figure can be missing, and the new source.
- `vote-data`: the record of the sources names the new answers of STAT-TAB and the register's
  list of 2024-01-01.

## Impact

- **Pipeline:**
  - `download.py`: six more tables, twelve more queries and the lists' dates;
  - `characteristics.py`: their readers and checks, and counts that may be withheld;
  - `update.py` and `write.py`: the new counts in `characteristics.json` and the new answers in
    `sources.json`;
  - `pipeline/README.md`: the sources;
  - a run of the update, which writes the two data files anew.
- **App:**
  - `characteristics.ts`: 14 definitions, a group for each characteristic, a unit with one
    decimal, the jobs' year among the figures that apply;
  - `vote-data.ts`: the types of the new counts;
  - the texts in three languages: 14 names, four group headings, the list's headings, the
    guide's and the panel's sentences;
  - `CharacteristicsPanel.svelte` and `Limits.svelte`: the groups;
  - the guide page.
- **Tests:** unit tests of the new definitions against the data file and the investigation's
  figures; pipeline tests with made-up tables; browser tests of the panel, the list, the keys and
  the link's budget.
- **Docs:** `README.md`, `CLAUDE.md`, `docs/roadmap.md`.
- **No new dependency.**
