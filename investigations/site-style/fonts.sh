#!/usr/bin/env bash
# Found while proposing add-site-style (investigations/site-style.md, 2): five fonts that could be
# served with the site, as the npm packages of Fontsource publish them. It packs each package
# into a new directory outside the repository, unpacks it there, and runs fonts.py on them.
#
# Usage, from the root of the repository:
#   investigations/site-style/fonts.sh /new/path/outside/the/repository
set -euo pipefail

if [ $# -ne 1 ] || [ -e "$1" ]; then
  echo "usage: $0 /new/path/outside/the/repository (a directory that does not exist yet)" >&2
  exit 1
fi
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
mkdir -p "$1"
OUT="$(cd "$1" && pwd)"
case "$OUT/" in "$REPO"/*) echo "$OUT lies inside the repository" >&2; exit 1 ;; esac

cd "$OUT"
for package in @fontsource-variable/source-sans-3@5.3.1 @fontsource/atkinson-hyperlegible@5.3.0 \
  @fontsource-variable/noto-sans@5.3.0 @fontsource/ibm-plex-sans@5.3.0 \
  @fontsource-variable/inter@5.3.0; do
  file="$(npm pack "$package" --silent)"
  mkdir -p "${file%.tgz}"
  tar -xzf "$file" -C "${file%.tgz}"
done
cd "$REPO"
uv run --quiet --no-project --with fonttools==4.60.1 --with brotli==1.1.0 \
  python -I "$HERE/fonts.py" "$OUT" "$REPO"
