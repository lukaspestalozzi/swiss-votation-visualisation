#!/bin/bash
# Local verification: the same checks as CI (.github/workflows/ci.yml), in the same order.
#
#   1. openspec validate --all --strict   - OpenSpec specs and changes (CI job `specs`)
#
# There is nothing to build yet. The first roadmap change adds the steps of CI's `build` job
# after step 1 (formatter or linter, static analysis, tests, build) and points --quick at the
# fastest of them.
#
# Usage:
#   ./scripts/verify-local.sh          # all steps; run before every push
#   ./scripts/verify-local.sh --quick  # the fastest step only (today: step 1)
#
# Requirements: the OpenSpec CLI in the version CI pins in ci.yml
# (`npm install -g @fission-ai/openspec@<that version>`).

set -u
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STEPS=(
    "openspec validate --all --strict --no-interactive"
)

case "${1:-}" in
    "") ;;
    --quick) STEPS=("openspec validate --all --strict --no-interactive") ;;
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
