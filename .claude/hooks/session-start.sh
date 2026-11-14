#!/bin/bash
# SessionStart hook for Claude Code on the web: puts the Node version of CI on the PATH and
# installs pnpm, the OpenSpec CLI, the project's dependencies and the pipeline's environment.
# Idempotent: re-runs skip what is already there in the pinned version.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# The version CI pins in .github/workflows/ci.yml; scripts/verify-local.sh refuses any other.
OPENSPEC_VERSION="2.0.0"
# Workflows the committed OpenSpec skills (.agents/skills/) were generated with.
OPENSPEC_WORKFLOWS='["propose","explore","apply","update","sync","archive","verify"]'
# Node 24, the version of CI. The cloud image has it next to its default, Node 22.
NODE_BIN="/opt/node24/bin"

export OPENSPEC_TELEMETRY=0

# --- Node -------------------------------------------------------------------
export PATH="$NODE_BIN:$PATH"
node_version="$(node --version 2>/dev/null || true)"
if [[ "$node_version" != v24.* ]]; then
  echo "session-start: expected Node 24 in $NODE_BIN, found ${node_version:-none}" >&2
  exit 1
fi

# The hook's stdout becomes context of the session, so the tools' output is not passed on;
# errors still reach stderr and end the script.

# --- pnpm, in the version package.json pins ---------------------------------
pnpm_spec="$(node -p "require('./package.json').packageManager")"
if [ "pnpm@$(pnpm --version 2>/dev/null || true)" != "$pnpm_spec" ]; then
  npm install -g --no-audit --no-fund --loglevel=error "$pnpm_spec" >/dev/null
fi

# --- OpenSpec CLI -----------------------------------------------------------
if [ "$(openspec --version 2>/dev/null || true)" != "$OPENSPEC_VERSION" ]; then
  npm install -g --no-audit --no-fund --loglevel=error "@fission-ai/openspec@${OPENSPEC_VERSION}" >/dev/null
fi
openspec config set profile custom >/dev/null
openspec config set workflows "$OPENSPEC_WORKFLOWS" >/dev/null

# --- The project's dependencies ---------------------------------------------
# The Chromium of the browser tests is part of the cloud image, in the version of
# @playwright/test that app/package.json pins.
if ! install_output="$(pnpm install --frozen-lockfile 2>&1)"; then
  echo "$install_output" >&2
  exit 1
fi

# --- The pipeline's Python and packages --------------------------------------
# uv is part of the cloud image; it installs the Python of pipeline/.python-version and the
# packages of pipeline/uv.lock into pipeline/.venv.
if ! command -v uv > /dev/null 2>&1; then
  echo "session-start: uv not found; the pipeline needs it" >&2
  exit 1
fi
if ! sync_output="$(uv sync --directory pipeline --locked 2>&1)"; then
  echo "$sync_output" >&2
  exit 1
fi

# --- The session's environment ----------------------------------------------
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  for line in "export PATH=\"$NODE_BIN:\$PATH\"" "export OPENSPEC_TELEMETRY=0"; do
    if ! grep -qxF "$line" "$CLAUDE_ENV_FILE" 2>/dev/null; then
      echo "$line" >> "$CLAUDE_ENV_FILE"
    fi
  done
fi
