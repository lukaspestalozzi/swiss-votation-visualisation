# Tasks

## 1. The preview

- [x] 1.1 `app/vite.config.ts`: with `PREVIEW=1`, base `''`, relative paths, output
  `app/build/preview/`. Verify: `pnpm run build` without it writes the same files as before
  (the browser tests pass); with it, the pages' addresses are relative.
- [x] 1.2 `scripts/preview.mjs`: build the preview, add the address line to each page, pack the
  German slice and the launcher (branch, commit, date) into `app/build/preview-artifact/`, and
  write the lists of files to publish, each of at most 250. Verify: it runs; the pack served under
  a deep path and entered through the launcher's links shows the start page, a vote's map, a limit
  and "Mit Ihrer Auswahl" without a failed request but the font's preload.
- [ ] 1.3 Publish it to the preview Artifact, https://claude.ai/artifact/4orzLS5WyndrhghV2vFWnQ,
  removing the files of the earlier preview it no longer has. Verify: the Artifact's file list
  is the pack's; Q opens it on the phone.

## 2. Docs and checks

- [ ] 2.1 `CLAUDE.md`: the preview, its command and the procedure of publishing it; the code map
  of `scripts/`. `docs/roadmap.md`: row 17. Verify: `openspec validate --all --strict` passes.
- [ ] 2.2 Verify: `./scripts/verify-local.sh` passes all 11 steps.
