#!/bin/bash
# Local verification: the same checks as CI (.github/workflows/ci.yml), in the same order.
#
#   1. openspec validate --all --strict   - OpenSpec specs and changes (CI job `specs`)
#   2. pnpm run format:check              - formatting (CI job `build`, as all that follow)
#   3. pnpm run lint                      - lint; no issue is allowed, warnings included
#   4. pnpm run check                     - static analysis, with the module boundaries
#   5. pnpm run test                      - unit tests
#   6. pnpm run build                     - the static site, written to app/build
#   7. pnpm run test:e2e                  - browser tests against app/build
#
# Usage:
#   ./scripts/verify-local.sh          # all steps; run before every push
#   ./scripts/verify-local.sh --quick  # the unit tests only (step 5)
#
# Requirements: Node in the major version CI uses, pnpm, the installed dependencies
# (`pnpm install`), the browser of the browser tests
# (`pnpm --filter app exec playwright install chromium`), and the OpenSpec CLI in the version
# CI pins in ci.yml (`npm install -g @fission-ai/openspec@<that version>`).

set -u
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STEPS=(
    "openspec validate --all --strict --no-interactive"
    "pnpm run format:check"
    "pnpm run lint"
    "pnpm run check"
    "pnpm run test"
    "pnpm run build"
    "pnpm run test:e2e"
)

case "${1:-}" in
    "") ;;
    --quick) STEPS=("pnpm run test") ;;
    --help | -h)
        # The comment block above, without the shebang line.
        awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
        exit 0
        ;;
    *)
        echo "Unknown option: $1 (see --help)"
        exit 1
        ;;
esac

# The OpenSpec version CI pins, so that both validate by the same rules.
if printf '%s\n' "${STEPS[@]}" | grep -q '^openspec '; then
    OPENSPEC_VERSION="$(grep -oE '@fission-ai/openspec@[0-9][0-9.]*' .github/workflows/ci.yml | head -n 1 | cut -d@ -f3)"
    if [ -z "$OPENSPEC_VERSION" ]; then
        echo -e "${RED}[FAIL]${NC} no pinned OpenSpec version found in .github/workflows/ci.yml"
        exit 1
    fi
    installed="$(openspec --version 2> /dev/null || true)"
    if [ "$installed" != "$OPENSPEC_VERSION" ]; then
        echo -e "${RED}[FAIL]${NC} openspec ${installed:-not found}, CI uses $OPENSPEC_VERSION:" \
            "npm install -g @fission-ai/openspec@$OPENSPEC_VERSION"
        exit 1
    fi
fi
export OPENSPEC_TELEMETRY=0

# The major version of Node CI uses. pnpm checks it when it installs, not when it runs a script.
if printf '%s\n' "${STEPS[@]}" | grep -q '^pnpm '; then
    NODE_MAJOR="$(grep -oE "node-version: '[0-9]+'" .github/workflows/ci.yml | head -n 1 | grep -oE '[0-9]+')"
    if [ -z "$NODE_MAJOR" ]; then
        echo -e "${RED}[FAIL]${NC} no Node version found in .github/workflows/ci.yml"
        exit 1
    fi
    installed="$(node --version 2> /dev/null || true)"
    if [ "${installed%%.*}" != "v$NODE_MAJOR" ]; then
        echo -e "${RED}[FAIL]${NC} node ${installed:-not found}, CI uses Node $NODE_MAJOR"
        exit 1
    fi
fi

# Every step runs, so that one run shows all failures.
failed=0
for i in "${!STEPS[@]}"; do
    echo -e "\n${YELLOW}=== Step $((i + 1))/${#STEPS[@]}: ${STEPS[$i]} ===${NC}"
    if ${STEPS[$i]}; then
        echo -e "${GREEN}[PASS]${NC} ${STEPS[$i]}"
    else
        echo -e "${RED}[FAIL]${NC} ${STEPS[$i]}"
        failed=$((failed + 1))
    fi
done

echo
if [ "$failed" -gt 0 ]; then
    echo -e "${RED}[FAIL]${NC} $failed of ${#STEPS[@]} steps failed"
    exit 1
fi
echo -e "${GREEN}[PASS]${NC} All ${#STEPS[@]} steps passed"
