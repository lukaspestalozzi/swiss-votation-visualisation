# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change** (counted on `7803b5f`):
- `pnpm run test`: 52 passed in the calculation and 127 in the app;
- the browser tests: 191, one at a time (`playwright test --list`);
- `uv run --directory pipeline --locked pytest`: 134 collected;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan; where a count differs while building, the note says so.
- A browser test is run alone with
  `pnpm run build && pnpm --filter app exec playwright test <file> -g "<its name>"`; "run alone"
  below means this.
- "Waits a second" in a browser test is `page.waitForTimeout(1000)` after the input: twice the
  half second of design decision 5.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. The link in plain TypeScript

Spec `share-link`, "The selection in the address", "The keys of the characteristics", "Opening a
link" and "The parts a link cannot use"; design, decisions 1 to 4.

- [ ] 1.1 Writing a link. Create `app/src/lib/share-link.ts` with `linkOf(limits, abroadCounted)`,
  the part after `#` without the `#`, and `app/src/lib/share-link.test.ts`, against
  `characteristics.json` and the vote day of 2016-02-28. The tests, one at a time:
  - no limit and the switch on: the empty string;
  - "Ausländeranteil" with its upper bound at step 327: `foreigners=-19.98`;
  - then "Einwohner" with its lower bound at step 500, and the switch off:
    `foreigners=-19.98&inhabitants=3508-&abroad=no`;
  - a limit at both ends, and one whose lower bound is at step 1 of "Einwohner", whose value is
    still the end's: `inhabitants=-` both;
  - the switch off alone: `abroad=no`;
  - the 21 keys, in the order of `DEFINITIONS`, as the spec lists them.

  Verify: `pnpm --filter app exec vitest run src/lib/share-link.test.ts` passes, 6 tests.
- [ ] 1.2 Reading a link. Add `selectionOf(hash, file, voteDate)` to `share-link.ts`: the limits
  with their tracks and steps, the switch, and the unusable parts as `<key>=<value>`, read with
  `URLSearchParams` (design, decision 4). The tests, one at a time:
  - `foreigners=-19.98`: one limit, steps 0 and 327, the switch on, no unusable part;
  - `foreigners=-20&inhabitants=3000-`: steps 327 and 483 (spec, "A value no step has");
  - a value between two steps at the same distance takes the lower (found on a track of the
    file, named in the test);
  - an empty link, and `abroad=no` alone;
  - each unusable part of the spec's three scenarios: `rainfall=1-2`, `foreigners=30-20`,
    `inhabitants=1'000-`, `abroad=yes`, `foreigners=10-` after `foreigners=-19.98`; and
    `foreigners=1-2-3`, `foreigners=19.987-`, `foreigners`;
  - a value encoded by a messenger, `foreigners=%2D19.98`, reads as `foreigners=-19.98`.

  Verify: `pnpm --filter app exec vitest run src/lib/share-link.test.ts` passes, 14 tests.
- [ ] 1.3 The round trip. A test that, for every characteristic on the vote day of 2016-02-28,
  writes a limit with its upper bound at each step and reads it back to a step of the same value
  (investigation, 5).

  Verify: the test passes, 15 tests in the file. Against a mutant that writes one decimal too
  few, it fails.

## 2. The page writes its address

Spec `share-link`, "The selection in the address", "The keys of the characteristics" and "The
address follows the selection"; design, decisions 5 and 10.

- [ ] 2.1 The writer. Create `app/e2e/share-link.spec.ts` with a test of the scenario "A limit".
  Seen to fail: the address stays `/de/votes/5960/`. Then, in `+page.svelte`: the link derived by
  `linkOf`; once the characteristics have loaded, an effect that restarts a timer of 500 ms at
  every change of the link, and writes the address with SvelteKit's shallow `goto`, by `resolve`,
  when it differs from the address's.

  Verify: run alone, the test passes.
- [ ] 2.2 The other forms. Tests of "Two limits and the switch", "A limit that sets nothing
  aside", "Back to the real result" and "The keys in French", one at a time.

  Verify: each run alone passes; each written after 2.1, so a mutant of `linkOf` (no empty bound)
  shows the first two fail.
- [ ] 2.3 The history. Tests of "Back leaves the page" and "Nothing is sent": the second collects
  every request's address while making the selection and reloading, and none contains
  `foreigners`.

  Verify: each run alone passes; against a mutant that writes with `replace: false`, "Back
  leaves the page" fails.
- [ ] 2.4 A held key. A test of "A held key": a script added before the page loads counts the
  page's calls of `history.replaceState`; the count starts after the limit has been added and a
  second has passed; 100 presses of the left arrow key, 33 ms apart; a second later the count is
  1 and the address `#foreigners=-54.99`.

  Verify: run alone, the test passes; against a mutant with a timer of 0 ms, it fails with a count
  above 1.
- [ ] 2.5 The budgets of the limits. The limits' budget tests, "Dragging a bound" and "Jumps", run
  with the writer.

  Verify: `pnpm --filter app exec playwright test limits.spec.ts -g "budget"` passes.

## 3. The page reads its address

Spec `share-link`, "Opening a link", "A link in the same tab", "The parts a link cannot use", "The
sentence goes with the next change", "A tie-break question ignores the address" and "The budget
of a link"; spec `limits`, "Limits belong to the page"; design, decisions 4, 6, 7 and 10.

- [ ] 3.1 Opening a link. A test of "A link". Seen to fail: no limit. Then, in `+page.svelte`, when
  the characteristics have loaded: read `location.hash` with `selectionOf`, set `limits` and
  `abroadCounted`, then start the writer of 2.1.

  Verify: run alone, the test passes.
- [ ] 3.2 More links. Tests of "A value no step has" (with the address a second later), "A
  reload", "The characteristics cannot be loaded", and `limits`' "A link with a selection", one at
  a time.

  Verify: each run alone passes; against a mutant that starts the writer before the
  characteristics have loaded, "The characteristics cannot be loaded" fails.
- [ ] 3.3 A link in the same tab. A test of "Another link to the same vote", with a mark on
  `window` to show that the page did not load again. Seen to fail: the limit "Einwohner" stays.
  Then a `hashchange` listener in `+page.svelte` that reads the address again, once the
  characteristics have loaded.

  Verify: run alone, the test passes.
- [ ] 3.4 The unusable parts. Add `unusableParts` to `Texts` (`texts/index.ts`), in German, French
  and Italian as design decision 4 writes them; the page keeps the applied link and its unusable
  parts, and `Limits.svelte` shows the sentence below the guide's sentence. Tests of "An unknown
  characteristic", "Bounds that cannot be used", "A characteristic twice" and "Adding a limit",
  one at a time.

  Verify: each run alone passes; `pnpm --filter app exec vitest run src/lib/texts` passes, its
  test that no French or Italian text is the German one included.
- [ ] 3.5 The tie-break question. A test of "A link to a tie-break question".

  Verify: run alone, the test passes; against a mutant that reads the address on every vote's
  page, it fails.
- [ ] 3.6 The budget of a link. A test of "All 21 limits in the same tab", with `frames.ts`, as
  the limits' budget tests measure.

  Verify: run alone, the test passes; the largest frame it measured is in the note "As built".

## 4. The switch carries the selection

Spec `interface-languages`, "The switch between the languages"; design, decision 8.

- [ ] 4.1 The switch. In `languages.spec.ts`, the test "a selection stays behind" becomes "A
  selection goes along", with the spec's scenario. Seen to fail: `/it/votes/5960/` without the
  hash. Then `[lang]/+layout.svelte` adds `page.url.hash` to the links of the two other
  languages, in the browser only; its comment and that of `texts/index.ts` name "The switch
  between the languages".

  Verify: run alone, the test passes; `pnpm --filter app exec playwright test languages.spec.ts`
  passes, as `pnpm run build` does (the prerendered links have no hash).

## 5. The guide

Spec `reading-guide`, "Sharing a selection explained"; design, decision 9.

- [ ] 5.1 The sentence. A test in `guide.spec.ts` of "The sentence in the guide". Seen to fail.
  Then the third paragraph of the section "Gemeinden auswählen" in `de.ts`, `fr.ts` and `it.ts`,
  as design decision 9 writes it.

  Verify: run alone, the test passes; `pnpm --filter app exec playwright test guide.spec.ts`
  passes.

## 6. Docs and checks

- [ ] 6.1 `README.md`: the list of what the site shows adds that a page's address holds its
  selection, so that a link, a reload or the language switch keeps it.

  Verify: `git diff README.md` shows that sentence only.
- [ ] 6.2 All checks. `./scripts/verify-local.sh`.

  Verify: 11 of 11 steps pass; the counts are those planned (unit tests 52 and 142, browser tests
  about 212), or the note says why not.
- [ ] 6.3 `CLAUDE.md`: the status names `add-share-link` applied; the code map adds
  `app/src/lib/share-link.ts`, its tests and `app/e2e/share-link.spec.ts`, and changes the lines
  of `+page.svelte`, `Limits.svelte`, `[lang]/+layout.svelte` and the texts; "Where things are"
  adds `investigations/share-link.md` and its script among the investigations, and the spec
  `share-link`.

  Verify: every file `git diff --stat main` names under `app/` and `investigations/` is in
  `CLAUDE.md`.

## Workflow follow-up

- Push, open the pull request, and watch its CI.
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row 11 done, its
  capabilities `share-link`, `limits`, `interface-languages` and `reading-guide`; `CLAUDE.md`'s
  status names it archived and names the next change.
- After the merge, Q checks the published site on a phone: Safari on iOS with a selection, then a
  reload, a link sent to themselves, and the language switch (design, Risks).
