# Tasks

## 1. The lead

- [x] 1.1 `startLead` without its last sentence in three languages, `START_NOTE` in `texts/`,
  the start page writing both in `.lead`. Browser test in `vote-list.spec.ts`: the two lines in
  German, French and Italian. Verify: the test fails before the change and passes after;
  `pnpm run test` passes (the French spaces' test writes the new text).
- [x] 1.2 `CLAUDE.md` (the start page's line in the code map), `docs/roadmap.md` (a row,
  off-roadmap). Verify: `./scripts/verify-local.sh` passes in full.

## Workflow follow-up

- Verify the change, then archive it, and set its row in `docs/roadmap.md` to done.
