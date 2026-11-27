// The preview of a branch as a Claude Artifact (CLAUDE.md, "The preview"; design of
// add-pull-request-site). Builds the site with relative addresses (`PREVIEW=1`), packs its German
// pages, the scripts, the data files and the entries of the ten newest votes with a launcher page
// into app/build/preview-artifact/, and writes the lists of files to publish, at most 250 each.
// Run from the root: node scripts/preview.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const built = path.join(root, 'app/build/preview');
const pack = path.join(root, 'app/build/preview-artifact');
const NEWEST = 10;
const PER_PUBLISH = 250;

// The client finds no route for an address that ends in `index.html`, which is how the Artifact
// serves a page: this line, first in the head, writes the address as `.../` before the scripts start.
const ADDRESS_LINE =
  "<script>if(location.pathname.endsWith('/index.html'))history.replaceState(history.state,'',location.pathname.slice(0,-10)+location.search+location.hash)</script>";

execFileSync('pnpm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PREVIEW: '1' },
});

const { votes } = JSON.parse(fs.readFileSync(path.join(built, 'data/votes.json'), 'utf8'));
const newest = [...votes]
  .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  .slice(0, NEWEST)
  .map((vote) => vote.id);
const entries = new Set(newest.map((id) => `data/votes/${String(id)}.json`));

function kept(file) {
  if (file.startsWith('de/') || file.startsWith('_app/')) return true;
  if (file.startsWith('data/votes/')) return entries.has(file);
  return file.startsWith('data/') && !file.slice(5).includes('/');
}

fs.rmSync(pack, { recursive: true, force: true });
const files = [];
let bytes = 0;
for (const file of fs.readdirSync(built, { recursive: true }).sort()) {
  const from = path.join(built, file);
  if (!fs.statSync(from).isFile() || !kept(file.split(path.sep).join('/'))) continue;
  const to = path.join(pack, 'site', file);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (file.endsWith('.html')) {
    const page = fs.readFileSync(from, 'utf8');
    if (!page.includes('<head>')) throw new Error(`${file} has no <head>`);
    fs.writeFileSync(to, page.replace('<head>', `<head>${ADDRESS_LINE}`));
  } else {
    fs.copyFileSync(from, to);
  }
  bytes += fs.statSync(to).size;
  files.push(`site/${file.split(path.sep).join('/')}`);
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const commit = git('rev-parse', '--short', 'HEAD');
const date = new Date().toISOString().slice(0, 10);
const [first = 0, second = 0] = newest;
fs.writeFileSync(
  path.join(pack, 'index.html'),
  `<title>Vote Explorer Preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{color-scheme:light dark;--bg:light-dark(#ffffff,#121212);--ink:light-dark(#1a1a1a,#ececec);--soft:light-dark(#5c5c5c,#a8a8a8);--line:light-dark(#d9d9d9,#3a3a3a);--yes:light-dark(#0a7a62,#4cc4a3)}
:root[data-theme=light]{color-scheme:light}:root[data-theme=dark]{color-scheme:dark}
*{box-sizing:border-box;min-width:0}
body{background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;padding-block:32px;padding-left:max(5vw,16px,env(safe-area-inset-left,0px));padding-right:max(5vw,16px,env(safe-area-inset-right,0px))}
main{max-width:40rem}
h1{font-size:32px;line-height:1.1;margin:0 0 8px}
p{color:var(--soft);margin:0 0 24px;overflow-wrap:anywhere}
ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
li{border-bottom:1px solid var(--line)}
a{display:block;padding:16px 0;color:var(--ink);text-decoration:none;font-size:18px;font-weight:600}
a span{display:block;font-size:14px;font-weight:400;color:var(--soft)}
a:hover,a:focus-visible{color:var(--yes)}
small{display:block;margin-top:24px;color:var(--soft);font-size:13px}
</style>
<main>
<h1>Popular Vote Explorer, preview</h1>
<p>Built from <code>${branch}</code> at <code>${commit}</code> on ${date}, in German only.</p>
<ul>
<li><a href="site/de/index.html">Start page<span>Every vote, search and filters</span></a></li>
<li><a href="site/de/votes/5960/index.html">A vote: 28 February 2016<span>Map, limits and the selection's result</span></a></li>
<li><a href="site/de/compare/index.html#votes=${String(first)},${String(second)}">Comparison of two votes<span>The ten newest votes can be compared</span></a></li>
<li><a href="site/de/guide/index.html">Lesehilfe<span>The reading guide</span></a></li>
</ul>
<small>A preview for checking design and features. Reloading a page inside the site may not work here; go back to this page instead. The comparison has the entries of the ten newest votes only.</small>
</main>
`,
);

for (const old of fs.readdirSync(path.dirname(pack))) {
  if (/^preview-files-\d+\.json$/.test(old)) fs.rmSync(path.join(path.dirname(pack), old));
}
for (let start = 0, part = 1; start < files.length; start += PER_PUBLISH, part += 1) {
  const list = files.slice(start, start + PER_PUBLISH).map((file) => ({ path: file }));
  fs.writeFileSync(
    path.join(path.dirname(pack), `preview-files-${String(part)}.json`),
    JSON.stringify(list),
  );
}

console.log(
  `${String(files.length + 1)} files, ${(bytes / 1e6).toFixed(1)} MB, in ${pack}; ` +
    `lists: app/build/preview-files-*.json`,
);
if (files.length + 1 > 511) throw new Error('more than 511 files: an Artifact holds no more');
