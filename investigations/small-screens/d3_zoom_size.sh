#!/usr/bin/env bash
# Found while proposing add-small-screens (investigations/small-screens.md, 7): the size d3-zoom
# would add to the site. Installs d3-zoom 3.0.0 and d3-selection 3.0.0 into a new directory
# outside the repository, builds a page that attaches a zoom behaviour to an SVG with the app's
# Vite, and prints the size of the script, minified and gzipped; then the same for the scripts of
# the built site that a vote's page loads (build the site first).
#
# Usage: investigations/small-screens/d3_zoom_size.sh <new directory outside the repository>
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
dir="$1"
mkdir "$dir"
cd "$dir"
echo '{"name":"d3-zoom-size","private":true,"type":"module"}' > package.json
npm install --silent --no-audit --no-fund d3-zoom@3.0.0 d3-selection@3.0.0
ls node_modules
cat > entry.js <<'EOF'
import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
export function attach(svg, onZoom) {
  const behaviour = zoom().scaleExtent([1, 16]).on('zoom', (event) => onZoom(event.transform));
  select(svg).call(behaviour);
  return () => select(svg).call(behaviour.transform, zoomIdentity);
}
EOF
cat > index.html <<'EOF'
<!doctype html><svg></svg><script type="module">import { attach } from './entry.js'; window.reset = attach(document.querySelector('svg'), console.log);</script>
EOF
echo "export default { build: { outDir: 'dist' }, logLevel: 'warn' };" > vite.config.js
"$repo/app/node_modules/.bin/vite" build
for f in dist/assets/*.js; do
  echo "d3-zoom page: $(wc -c < "$f") bytes minified, $(gzip -9 -c "$f" | wc -c) gzipped"
done
for f in "$repo"/app/build/swiss-votation-visualisation/_app/immutable/{nodes,chunks}/*.js; do
  size=$(wc -c < "$f")
  if [ "$size" -gt 5000 ]; then
    echo "site $(basename "$f"): $size bytes minified, $(gzip -9 -c "$f" | wc -c) gzipped"
  fi
done
