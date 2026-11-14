# pipeline

The offline data pipeline. It turns the public sources into the data files the app loads, and
checks them. It runs on a developer's machine or in CI, never in the browser.

There is no code here yet. The change `add-vote-data` (#3 in `docs/roadmap.md`) decides its
language and its tools, after the data-sources investigation has shown the sources and their
formats.

## Boundary

Nothing imports from this directory. `calculation/` and `app/` share only the data files and
their format with the pipeline; the static analysis fails when one of them imports a file from
here (`pnpm run check`).

Whether the pipeline may use `calculation/` for its own checks is decided in #3.
