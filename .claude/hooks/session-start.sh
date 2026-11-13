#!/bin/bash
# SessionStart hook for Claude Code on the web: installs the OpenSpec CLI.
# Idempotent: re-runs skip the install when the pinned version is already there.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# The version CI pins in .github/workflows/ci.yml; scripts/verify-local.sh refuses any other.
OPENSPEC_VERSION="2.0.0"
# Workflows the committed OpenSpec skills (.agents/skills/) were generated with.
OPENSPEC_WORKFLOWS='["propose","explore","apply","update","sync","archive","verify"]'

export OPENSPEC_TELEMETRY=0

# --- OpenSpec CLI -----------------------------------------------------------
# The hook's stdout becomes context of the session, so npm's output is not passed on;
# errors still reach stderr and end the script.
if [ "$(openspec --version 2>/dev/null || true)" != "$OPENSPEC_VERSION" ]; then
  npm install -g --no-audit --no-fund "@fission-ai/openspec@${OPENSPEC_VERSION}" >/dev/null
fi
openspec config set profile custom >/dev/null
openspec config set workflows "$OPENSPEC_WORKFLOWS" >/dev/null

# --- Toolchain --------------------------------------------------------------
# Node is part of the cloud image. There is no dependency manifest yet: the first roadmap
# change adds the install of the project's dependencies here.

telemetry_off="export OPENSPEC_TELEMETRY=0"
if [ -n "${CLAUDE_ENV_FILE:-}" ] && ! grep -qxF "$telemetry_off" "$CLAUDE_ENV_FILE" 2>/dev/null; then
  echo "$telemetry_off" >> "$CLAUDE_ENV_FILE"
fi
