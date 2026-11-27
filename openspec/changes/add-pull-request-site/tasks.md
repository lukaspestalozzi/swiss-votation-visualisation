# Tasks

## 1. The artifact

- [ ] 1.1 In the job `build` of `.github/workflows/ci.yml`, after the upload of `github-pages`
  and on pull requests only: a step that writes `app/build/README.txt` (the pull request's
  number, the commit, the two commands, why a double click does not work), and a step that
  uploads `app/build/` with `actions/upload-artifact@v7` as `site-pr-<number>`, kept 14 days.
  Verify: the same commands run by hand on this machine write the README and leave the site
  folder as built; the workflow file is valid YAML.
- [ ] 1.2 Verify on this change's own pull request: its run shows `site-pr-<number>`, kept 14
  days; the artifact, downloaded and unpacked, holds `swiss-votation-visualisation/` and
  `README.txt`; served as the README says, `/swiss-votation-visualisation/de/votes/5960/` draws
  its map and shows "Mit Ihrer Auswahl" after a limit, without a failed request. Where this
  session cannot download the artifact, Q downloads it and the check runs on Q's word.

## 2. Docs

- [ ] 2.1 `README.md`: how to look at a pull request's site. `CLAUDE.md`: the CI's row and
  "Build and verify". `docs/roadmap.md`: row 17. Verify: `openspec validate --all --strict`
  passes.
- [ ] 2.2 Verify: `./scripts/verify-local.sh` passes all 11 steps.
