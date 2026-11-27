# Tasks

Each task runs its tests one at a time, as it writes them, and reports "Ran <test>: PASS / FAIL".

## 1. The cache

- [x] 1.1 A cache in the pipeline (`stat_tab_cache.py` or within `update.py`, whichever keeps the
  code map simpler): read an answer by its name and query from `pipeline/stat-tab-cache/`,
  checked against `index.json`; write one with `gzip` at `mtime=0`; an entry without its file or
  a file without its entry is an error that names it. Tests with made-up answers in a temporary
  directory: the same query is served, another query is not, the written bytes are the same
  twice, a missing file and a stray file each stop. Verify: `uv run --directory pipeline --locked
  pytest` passes.
- [x] 1.2 Which answers are final (design, decision 2): the census of 2000, every election but
  the newest, every population year but the newest. Tests: with made-up totals ending in 2025 and
  elections ending in 2023, the population of 2024 and the election of 2019 are final, 2025 and
  2023 are not. Verify: `pytest` passes.

## 2. The update

- [x] 2.1 `update.py` takes a final answer from the cache and keeps every final answer it asked
  in it; `--refresh` asks every answer and rewrites the cache; `--refresh` with
  `--reuse-downloads` is refused. Tests in `test_update.py` with made-up sources and a counting
  fetch: a second run asks only the newest year's queries and the one-query tables; the data files
  of both runs are the same bytes; a refresh asks all; a changed query is asked anew. Verify:
  `pytest` passes.
- [x] 2.2 `write.py`: each STAT-TAB answer in `sources.json` with `"cached"`. Test in
  `test_write.py`. Verify: `pytest` passes; `ruff format --check`, `ruff check` and `mypy` pass.

## 3. The real cache

- [ ] 3.1 Run `update --refresh` once: it fills `pipeline/stat-tab-cache/` and writes the data
  files. Verify: `git status` shows the cache (about 60 files, about 5.5 MB) and only
  `sources.json` changed among the data files, its new flags all `false`.
- [ ] 3.2 Run `update` once more. Verify: it ends in a few minutes, the report or a log line
  names the answers taken from the cache (53), `git status` shows `sources.json` changed only in
  those flags and nothing else, and the app's unit tests pass.

## 4. Docs and the whole

- [ ] 4.1 `pipeline/README.md` (the cache, when to refresh, `--refresh`), `CLAUDE.md` (the code
  map, the update's time in "Build and verify", `pipeline/stat-tab-cache/` in "Where things
  are"), `docs/roadmap.md` (a row, off-roadmap). Verify: read.
- [ ] 4.2 `./scripts/verify-local.sh` passes in full, 11 steps. Verify: its last line.

## Workflow follow-up

- Verify the change, then archive it, and set its row in `docs/roadmap.md` to done.
