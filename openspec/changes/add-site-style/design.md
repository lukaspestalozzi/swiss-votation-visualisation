# Design

## Context

What the change builds on:
- **No style of the site.** Each component styles what it needs in its own `<style>` block, with
  colours written into it:
  - the vote's page: the verdict boxes, the grey `#767676`;
  - `Limits.svelte`: the track `#999999`, the thumbs `#333333` with a white ring, the focus ring
    `#1a5fb4`;
  - `ResultMap.svelte`: white borders between municipalities, the box of details on 90 % white,
    the cantons `#333333`, the outline black on white, the swatches' border `#767676`;
  - `SelectionBar.svelte`: a white ground.
  - `result-map.ts` holds the map's colours, `HATCH_BACKGROUND` `#ffffff` among them, which
    `ResultMap.svelte` sets as an SVG attribute.
  - Everything else is the browser's: font, sizes, margins, links, buttons, the list, the switch.
- **The layouts.** `app/src/routes/+layout.ts` sets prerendering for every page; there is no root
  `+layout.svelte`. `[lang]/+layout.svelte` renders the language switch above every page under
  `/de/`, `/fr/` and `/it/`. The pages that redirect (`Redirect.svelte`) are outside it.
- **The verdicts as text.** `vote-page.ts` writes a verdict's word (`Verdict.verdict`), the
  outcome and a canton's side as strings; `vote-list.ts` writes an entry's result as one string,
  "angenommen, 52.13%" in German. Neither says which side a string stands for.
- **The browser tests** run one at a time against the build. The budget tests measure each
  frame's work after an input with `app/e2e/frames.ts`.

`investigations/site-style.md` gives the facts this design rests on:
- today's look (1);
- the five fonts and the site's characters (2);
- the contrasts of both palettes (3);
- a dark ground and the map (4);
- the map's size for a width (5);
- where the pages name the start page, the guide and a verdict (6).

## Goals / Non-Goals

**Goals:**
- **One source of the colours.** Every colour of the page is named once, for each scheme; the
  components use the names.
- **Tests of what a visitor reads:** the font rendered and the contrast of every text, in both
  schemes and the three languages.
- **The map as it is**, apart from what a dark ground needs.

**Non-Goals:**
- **A design system or a CSS framework.** A few named colours and plain CSS.
- **Styles for print.**
- **Motion:** no transitions or animations.

## Decisions

### 1. Source Sans 3, served with the site (Q)

The site's font is Source Sans 3, from the npm package `@fontsource-variable/source-sans-3`
5.3.1, under the SIL Open Font License 1.1. Its CSS `wght.css` declares seven subsets, each with
its `unicode-range`. The browser downloads only the Latin file, 28,872 bytes, which holds every
character the site writes (investigation, 2). Vite builds all seven files into `_app/`.

The reasons:
- **It sets every weight** with one file, the smallest of the five measured;
- **Its digits have one width**, so the figures of the tables line up;
- **Its letters are the narrowest measured** (0.448 em), about as wide as today's serif, so the
  360-pixel pages most likely keep fitting.
- **The test machine renders what a phone renders**, where today each renders its own serif.

The file's name table carries Adobe's copyright and the licence's address, so the notice travels
with the font.

Alternatives considered:
- **The system's font** (`system-ui`): no bytes, but each device sets the page differently, and
  the tests measure a font no visitor sees.
- **Atkinson Hyperlegible**, 34.7 KB: drawn for low vision, but its digits differ in width.
- **Inter**, 48.3 KB, and **Noto Sans**, 35.8 KB: wider letters, more broken words at 360.
- **IBM Plex Sans**, 45.4 KB, two files.
- **Copying the file into `app/static/`**: no dependency, but no version and no licence beside
  it.

### 2. Loading the font: a root layout, a preload, the system's sans-serif until then

A new `app/src/routes/+layout.svelte` imports the site's stylesheet, `app/src/app.css`, so that
every page has it, the pages that redirect included.
- **The stylesheet imports the package's `wght.css`.**
- **The root layout preloads the Latin file**, `<link rel="preload" as="font" crossorigin>`,
  with its address from Vite (`?url`), so that it is requested with the page rather than after
  the stylesheet. That address is the stylesheet's own, so a page requests the file once.
- **The font is named before `sans-serif`**, and the package's `font-display: swap` shows the
  text in the system's sans-serif until the file has loaded, and for good when it cannot load.

Alternatives considered:
- **The stylesheet in `[lang]/+layout.svelte`**: the pages that redirect would stay in the
  browser's serif.
- **No preload**: the file is found only once the stylesheet is parsed, and the text changes font
  later.
- **`font-display: block`**: no text until the font has loaded, and none at all for a while when
  it cannot load.

### 3. The colours as named custom properties, in one stylesheet

`app.css` names every colour of the page on `:root`, once for the light scheme and once inside
`@media (prefers-color-scheme: dark)`:

| Name | Light | Dark | Use |
|------|-------|------|-----|
| `--ground` | `#ffffff` | `#121212` | the page; the borders between municipalities; the ground under the hatching; the bar |
| `--text` | `#1c1c1c` | `#e8e8e8` | text; a thumb's fill |
| `--text-secondary` | `#595959` | `#b0b0b0` | a vote's date and kind, in the list and on its page; sources and notes; the map's and the panel's sources |
| `--link` | `#1a5fb4` | `#8ab4f8` | links; the ring of a focused control |
| `--greyed` | `#767676` | `#9a9a9a` | the cantonal votes of a majority that is not needed |
| `--border` | `#767676` | `#9a9a9a` | the borders of controls and of the verdict boxes; a limit's track; the swatches' border |
| `--yes` | `#007260` | `#4bc1ad` | a yes verdict |
| `--no` | `#934319` | `#e5946f` | a no verdict |

`:root` also sets `color-scheme: light dark`, so that the browser draws its own parts, the
scrollbars and a checkbox's tick, in the scheme.

The components' `<style>` blocks use the names instead of the colours they write today. Each
contrast is the investigation's (3), all at least 4.5:1, the borders 4.54:1 and 6.66:1.
- **The map's colours stay in `result-map.ts`**: the classes, the tie, the lakes, the set-aside
  grey and the hatching's lines.
- **`HATCH_BACKGROUND` goes.** The pattern's ground and the legend's hatched swatch take
  `var(--ground)` through CSS, since an SVG attribute cannot name a custom property.

Alternatives considered:
- **Colours written in each component**, as now: a dark scheme would repeat every one.
- **A CSS framework** (Tailwind and others): a dependency and a build step for a few colours.

### 4. The light palette: neutral, one blue (Q)

- **Text:** `#1c1c1c` on white, not black, which softens the page without losing contrast,
  17.04:1.
- **Links:** `#1a5fb4`, already the sliders' focus colour.
- **No red:** beside the map's no colours, red would read as "no".

Alternatives considered:
- **A Swiss red accent**, `#c8102e` or `#d52b1e`: it reads as "no".
- **An off-white ground**: the grey of a majority that is not needed falls to 4.16:1.
- **The browser's link blue**, `#0000ee`: a third, unrelated colour beside the map's.

### 5. Verdicts in the map's colours, wherever a verdict is written (Q)

A yes takes `--yes`, a no `--no`: the map's darkest classes in the light scheme, `#007260` 5.87:1
and `#934319` 6.87:1, and its class 2 in the dark one, `#4bc1ad` 8.50:1 and `#e5946f` 7.85:1, as
the darkest fail on a dark ground (2.90:1 and 2.48:1 on `#1c1c1c`).

Where:
- **The verdict boxes**, for the vote and for "Mit Ihrer Auswahl";
- **the outcome**;
- **the side of each canton** in the table;
- **the bar** of a narrow window;
- **the start page's list.** Its whole result takes the colour, as it is one string per language
  ("angenommen, 52.13%"), and splitting it would make each language's text a pair.
- **What keeps the text's colour:** "nicht nötig", a canton with nothing left ("–"), and the
  tie-break question's figures.

The data says the side:
- `vote-page.ts` gains a side for each verdict, `'yes'`, `'no'` or `null` for "nicht nötig";
- the outcome and each canton's row gain a side the same way;
- `vote-list.ts` gains a side for each entry, `null` for a tie-break question.

The components set a class from the side; the words stay as they are.

Alternatives considered:
- **Verdicts in the text's colour**: the page reads more calmly, but the map and the verdicts
  stay unrelated.
- **The map's class 3 on white**: 3.44:1 and 3.96:1, below 4.5:1.
- **Only the boxes and the outcome**: the bar and the table would speak another language than
  the boxes.

### 6. A dark scheme that follows the browser, the map on `#121212` (Q)

The names of decision 3 take their dark values under `prefers-color-scheme: dark`. The page
follows the browser's preference, also when it changes on an open page, as CSS does by itself,
without a script.
- **There is no switch, and no cookie or local storage:** a switch would need a stored choice,
  and the constraint on privacy asks for none.
  - **`sessionStorage` is left to SvelteKit (Q, while applying).** Its router writes
    `sveltekit:history-info`, `sveltekit:snapshot` and `sveltekit:navigation-snapshot` whenever
    a page is left: the scroll position and empty snapshots, which go with the tab. So the spec
    names what outlives the tab, cookies and local storage, and the test checks those.
  - Alternatives considered:
    - **Nothing of the scheme in any storage**, with SvelteKit's own keys allowed: more to
      specify.
    - **Truly nothing**: only without SvelteKit's client-side router, which the vote's page
      needs.
- **The map keeps its colours on the dark ground**:
  - the borders between municipalities and the ground under the hatching are `--ground`, as they
    are white today;
  - the outline stays black on a white halo, which shows on both grounds;
  - the cantons' borders stay `#333333`, drawn over the municipalities.
  - The set-aside grey `#2c2c2c` is 11.1 apart from `#121212` (investigation, 4).

Alternatives considered:
- **Light only**: one palette and one set of checks, but a bright page in a dark room.
- **A dark page with the map on a light panel**: the map unchanged, but a bright block in a dark
  page.
- **A black ground**, 29.3 apart from the set-aside grey: harsh, and light text glares on it.
- **`#1c1c1c` with a darker set-aside grey for the dark scheme**: a second grey in the legend,
  and its distances measured anew.

### 7. The head: the title, the guide and the language switch (Q)

`[lang]/+layout.svelte` renders a `<header>` above every page under `/de/`, `/fr/` and `/it/`,
holding, in order:
- **the working title**, linked to the start page in the page's language;
- **the guide's heading** (`GUIDE_HEADING`: "Lesehilfe", "Guide de lecture", "Guida alla
  lettura"), linked to the guide;
- **the language switch** of today.

On its own page, the title or the guide's name is text with `aria-current="page"`, as the
switch's own language is. The start page loses its link "Lesehilfe und Quellen". The sentence at
the limits keeps it (`GUIDE_LINK`), and "Alle Abstimmungen" stays on the vote's page and the
guide.

The head wraps between its parts, never within a word, so at 360 pixels it takes two lines.

Alternatives considered:
- **The title and the switch only**, the links staying where they are.
- **The title replacing "Alle Abstimmungen"**: fewer links, but four specs change.

### 8. The width: no limit, 16 pixels at each side, paragraphs at most 40rem (Q)

- **The body** has no margin, and 16 pixels of padding at its left and right.
- **A paragraph** is at most 40rem wide, about 70 characters a line.
- **The guide's `section` rule of 45rem goes**, as its paragraphs now have their own.
- **The map, the panel and the tables** take what the window gives, as now: 1,552 pixels for the
  map at 1920 (investigation, 5).

Alternatives considered:
- **A column of 72rem, 64rem or 80rem**: a calmer page on a wide screen, and a smaller map.
- **8 pixels at each side**, as now, or 8 below 640 and 16 from it: more room on a phone, but
  text at the very edge of its screen.

### 9. The sizes of the text

- **Body text:** 16 pixels, the browser's default, so a visitor's own setting still applies.
  Source Sans 3's taller lowercase reads larger than today's serif at that size.
- **Line height:** 1.5 for text and 1.25 for headings.
- **Headings:** the browser's sizes, in bold (700).
- **The verdict boxes** keep #10's smaller sizes below 640 pixels.

These sizes change no requirement. They are chosen here and seen in the screenshots of
decision 11.

Alternatives considered:
- **17 or 18 pixels**: larger, but more words to break at 360.
- **A scale of its own** for the headings: nothing on the pages asks for one.

### 10. Controls drawn by the page

- **Buttons and the list:**
  - a border of `--border` on `--ground`, text in `--text`, 4-pixel corners;
  - a button that cannot be used is drawn at half opacity, which WCAG exempts;
  - #10's sizes on a touch screen stay.
- **Focus:** `:focus-visible` draws `outline: 2px solid var(--link)` with an offset of 2 pixels on
  every focusable element, links included, and on the thumbs, as `Limits.svelte` does today.
- **The switch:** the browser's checkbox with `accent-color: var(--link)`, its box drawn by the
  browser in the scheme (`color-scheme`).
- **A limit's track:** `--border`. Today's `#999999` has 2.85:1, below 3:1.
- **A limit's thumbs:** filled with `--text` and ringed with `--ground`, so that they show on both
  grounds; the ring keeps #10's transparent 44-pixel border on a touch screen.
- **The map's buttons:** drawn as the other buttons, opaque on the map.
- **The bar:** on `--ground`, with its top border in `--border`.
- **The box of details:** on `--ground` at 90 %, `color-mix(in srgb, var(--ground) 90%,
  transparent)`.

Alternatives considered:
- **The browser's own controls**, made dark by `color-scheme` alone: their borders in Chromium's
  light scheme reach about 2.5:1 for a button's grey, and they differ from browser to browser.

### 11. Checks: contrast and font in a browser test, screenshots for Q (Q)

- **`app/e2e/site-style.spec.ts`**, one test per scenario of `site-style`.
- **`app/e2e/contrast.ts`** walks the page's text and computes each text's contrast with WCAG's
  formula:
  - every element with text of its own, in the HTML;
  - its colour, against the first ancestor with an opaque ground, a ground at less than full
    opacity laid over the one behind it;
  - "large" is at least 24 pixels, or 18.66 pixels in bold;
  - the SVG holds no text, and the box of details is empty while nothing is pointed at.
- **The font rendered**, through Chrome's DevTools protocol (`CSS.getPlatformFontsForNode`), as
  `look.cjs` does.
- **The dark scheme** through Playwright's `emulateMedia({ colorScheme: 'dark' })`.
- **Screenshots** at 360 and 1,280 pixels, in both schemes: the start page, the guide, and a vote
  with a selection. They are sent to Q in this session, as GitHub's interface takes images and
  its API does not, and are not committed.
- **No pixel comparison.**

Alternatives considered:
- **Screenshot baselines** (`toHaveScreenshot`): they break with every new Chromium.
- **axe-core**: a dependency, and it leaves out what its rules cannot decide.
- **Eyes only**.

### 12. The facts in an investigation (Q)

`investigations/site-style.md` with `look.cjs`, `fonts.sh` and `fonts.py`, and `colours.py`, as
the seven before it.

### Tests

- **App (Vitest):**
  - `vote-page.test.ts`: the sides of the verdicts, the outcome and the cantons' rows, for the
    vote of 2016-02-28 and for a selection where the Ständemehr is not needed;
  - `vote-list.test.ts`: the side of an entry, and none for a tie-break question;
  - each seen to fail first.
- **Browser (Playwright):**
  - `site-style.spec.ts`, one test per scenario of `site-style`;
  - in `result-map.spec.ts`, one test per added or modified scenario;
  - in `guide.spec.ts`, the start page's link becomes the head's, and a test for the vote's page.
  - The existing tests pass, the 360-pixel tests of `small-screens` among them, now with the font
    and 16 pixels at each side.
- **The budget tests** wait for `document.fonts.ready` before their first input, so that the
  font's arrival is never one of the frames they measure.

### Dependencies added

`@fontsource-variable/source-sans-3` 5.3.1, a dev dependency of `app` like the others the build
reads: the font file, its CSS and its licence. It has no dependencies of its own. Its file is
built into the site; no request goes to another server.

### Performance budget

- **A step of a slider:** within the limits' 16 ms, as now. The colours of the selection's
  verdicts change by a class on at most five words and 26 rows, from the same derived result.
- **Zoom, move, pointing, a click or a tap:** within the map's 16 ms, as now; the map's colours
  and paths do not change.
- **Loading:** one file of 28,872 bytes, preloaded.
- **A change of the browser's scheme** is not an input of the page. It restyles the page once and
  has no budget.

## Risks / Trade-offs

- **[A page wider than 360 pixels with the new font and sides]** → The 360-pixel tests of
  `small-screens` decide. If the Italian verdict boxes no longer fit, their padding below 640
  pixels shrinks further, as #10's decision 6 allows. Source Sans 3 is about as wide as today's
  serif (investigation, 2).
- **[The font arrives while a budget test measures]** → The preload, and the budget tests wait
  for `document.fonts.ready`.
- **[A phone renders the font or the dark scheme differently]** → Checked by hand on a phone
  after the merge, together with #10's check.
- **[The colour of a verdict as its only sign]** → The word always stands: "Ja", "Nein",
  "Angenommen", "Abgelehnt".
- **[The hatching's lines have 2.85:1 on white]** → Kept, as the map's colours are #6's; the
  legend names the hatching. On the dark ground they have 6.58:1.
- **[The contrast test misses text over an image]** → The page has none: the SVG holds no text,
  and the box of details is tested empty. Its ground at 90 % keeps the text legible over any
  colour of the map.

## Migration Plan

1. Apply; `./scripts/verify-local.sh` passes. No data file changes.
2. Screenshots to Q; what Q wants changed is changed before the merge.
3. Merge by rebasing. CI publishes the site.
4. Q checks by hand on a phone, in its light and dark mode, together with #10's list:
   - the head, the font, and the colours of the verdicts on `/de/votes/5960/`;
   - the map in the dark.
5. What fails there becomes a small change of its own.
6. Rollback: revert the commits on `main`; CI publishes the site as before.
