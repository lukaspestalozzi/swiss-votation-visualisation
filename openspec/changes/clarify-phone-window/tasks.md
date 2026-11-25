# Tasks

## 1. The fixes

- [x] 1.1 Add `investigations/redesign/phone_heights.cjs`, the height a window needs for the
  selection's result and the first limit's sliders, by language and width, and its output to
  `investigations/redesign.md`, "Found after the merge". Verify: the figures of the proposal and
  the delta come from its output.
- [x] 1.2 Move the browser test of small-screens "The result and the first limit in one window"
  to a phone 360 by 700 pixels, in three languages. Verify: it passes, and fails in a window 360
  by 640 pixels.
- [x] 1.3 Add browser tests of the French and Italian sentences `reword-site-texts` changed: the
  selection's place (`app/e2e/limits.spec.ts`) and the guide's three sentences
  (`app/e2e/guide.spec.ts`). Verify: they pass, and each fails when it expects the sentence of
  before.
- [x] 1.4 `README.md`: on a phone the limits stand between the result and the map; `CLAUDE.md`
  and `docs/roadmap.md` name the change. Verify: `openspec validate --all --strict` passes.
- [x] 1.5 Verify: `./scripts/verify-local.sh` passes all 11 steps.
