// Writes the mockups of redesign-site (investigations/redesign.md, 6) from the real content of the
// site, as `extract.cjs` and `hist.mjs` wrote it to <dir>: a vote's page with and without a
// selection, the start page, the comparison, the guide, and single states. Throwaway: not product
// code. The pages hold the map's shapes and the font, so each is one file.
//
// Usage: node investigations/redesign/mockups/build.mjs <repository> <dir outside the repository>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [repo, out] = process.argv.slice(2);
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const site = read(join(out, 'site.json'));
const more = read(join(out, 'more.json'));
const hist = read(join(out, 'hist.json'));
const map = read(join(repo, 'app/static/data/map.json'));
const css = readFileSync(join(here, 'mock.css'), 'utf8');
const font = readFileSync(
  join(
    repo,
    'app/node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2',
  ),
).toString('base64');
const guideHtml = readFileSync(
  join(repo, 'app/build/swiss-votation-visualisation/de/guide/index.html'),
  'utf8',
);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (text) => Number(text.replace('%', ''));
const SCALE = [
  '#934319',
  '#c2673b',
  '#e5946f',
  '#fbbea3',
  '#92dfd0',
  '#4bc1ad',
  '#009c86',
  '#007260',
];
const KOENIZ = 355;
const INTRO =
  'Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten Gemeinden abgestimmt hätten. Es zeigt nicht, wie einzelne Menschen gestimmt haben, und ist keine Prognose. <a href="guide.html">Lesehilfe und Quellen</a>';

// ---------- The frame of a page ----------
const mark = `<span class="mark" aria-hidden="true"></span>`;

const head = (current) => {
  const entry = (key, href, text) =>
    current === key ? `<span aria-current="page">${text}</span>` : `<a href="${href}">${text}</a>`;
  return `
<header class="head"><div class="head-inner">
  ${current === 'start' ? `<span class="wordmark">${mark}Popular Vote Explorer</span>` : `<a class="wordmark" href="start.html">${mark}Popular Vote Explorer</a>`}
  <nav class="nav" aria-label="Seiten">
    ${entry('compare', 'compare.html', 'Vergleichen')}
    ${entry('guide', 'guide.html', 'Lesehilfe')}
  </nav>
  <nav class="languages" aria-label="Sprache">
    <span aria-current="true"><span class="long">Deutsch</span><span class="short">DE</span></span>
    <a href="#"><span class="long">Français</span><span class="short">FR</span></a>
    <a href="#"><span class="long">Italiano</span><span class="short">IT</span></a>
  </nav>
</div></header>`;
};

const tools = (links) => `
<div class="mock-tools" role="group" aria-label="Schalter des Entwurfs">
  <span>Entwurf, nicht bedienbar</span>
  <button type="button" data-set="theme">Hell / Dunkel</button>
  ${links.map(([href, text]) => `<a href="${href}">${text}</a>`).join(' ')}
</div>
<script>
  const root = document.documentElement;
  const query = new URLSearchParams(location.search);
  if (query.has('clean')) root.classList.add('clean');
  if (query.get('theme')) root.dataset.theme = query.get('theme');
  for (const button of document.querySelectorAll('[data-set]')) {
    button.addEventListener('click', () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
    });
  }
</script>`;

const ALL = [
  ['vote-b.html', 'Abstimmung'],
  ['vote-b-real.html', 'ohne Auswahl'],
  ['start.html', 'Startseite'],
  ['compare.html', 'Vergleich'],
  ['guide.html', 'Lesehilfe'],
  ['parts.html', 'Einzelne Zustände'],
];

const page = ({ title, bodyClass, body, current, file, script = '' }) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
@font-face { font-family: 'Source Sans 3 Variable'; font-style: normal; font-display: swap; font-weight: 200 900; src: url(data:font/woff2;base64,${font}) format('woff2-variations'); }
${css}
</style>
</head>
<body class="${bodyClass}">
${head(current)}
${body}
${tools(ALL.filter(([href]) => href !== file))}
${script}
</body>
</html>
`;

// ---------- Parts ----------
let svgs = 0;
const mapSvg = (fills, outlined) => {
  const id = `hatch${String(svgs++)}`;
  const shape =
    outlined === null ? null : map.municipalities.find(([number]) => number === outlined)[1];
  return `<svg class="map-svg" viewBox="0 0 ${String(map.width)} ${String(map.height)}" role="img" aria-label="Karte der Gemeinden">
<defs><pattern id="${id}" width="1500" height="1500" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch-ground" width="1500" height="1500"/><line x1="0" y1="0" x2="0" y2="1500" stroke="var(--hatch)" stroke-width="500"/></pattern></defs>
<path d="${map.outline}" fill="var(--lake)"/>
<g class="municipalities">${map.municipalities
    .map(([number, d]) => `<path d="${d}" fill="${fills[number].replace('#hatch', `#${id}`)}"/>`)
    .join('')}</g>
<g class="lakes">${map.lakes.map((d) => `<path d="${d}" fill="var(--lake)"/>`).join('')}</g>
<g class="cantons">${map.cantons.map(([, d]) => `<path d="${d}"/>`).join('')}</g>
${shape === null ? '' : `<g class="outlined"><path class="halo" d="${shape}"/><path class="line" d="${shape}"/></g>`}
</svg>`;
};

const shareBar = (yesShare, extra = '') =>
  `<div class="bar${extra}"><span class="yes" style="width:${String(yesShare)}%"></span><span class="no"></span><i class="half"></i></div>`;

const cantonBar = (rows) => {
  const weight = (votes) => (votes === '1' ? 2 : 1);
  const segment = (row, side) =>
    `<span class="${side}" style="flex:${String(weight(row[2]))} 0 0" title="${row[0]}: ${row[1]}"></span>`;
  return `<div class="bar cantons">${rows
    .filter((row) => row[3] === 'Ja')
    .map((row) => segment(row, 'yes'))
    .join('')}${rows
    .filter((row) => row[3] === 'Nein')
    .map((row) => segment(row, 'no'))
    .join('')}<i class="half"></i></div>`;
};

const sideOf = (word) => (/^(Ja|Angenommen)$/.test(word) ? 'yes' : 'no');

const resultHtml = (label, result, rows) => {
  const figures = Object.fromEntries(result.figures);
  const [people, cantons] = result.verdicts;
  const none = rows.filter((row) => row[3] === '–').map((row) => row[0]);
  const needed = cantons[1][1] !== 'nicht nötig';
  const foot = figures.Stimmbeteiligung
    ? `Stimmbeteiligung ${figures.Stimmbeteiligung}`
    : none.length
      ? `${none.join(' und ')}: keine Gemeinde übrig`
      : '&nbsp;';
  return `<section class="result">
  <div><h2 class="result-label">${label}</h2><p class="word side-${sideOf(result.outcome)}">${result.outcome}</p></div>
  <div class="meter">
    <p class="meter-head"><span class="meter-name">${people[0][1]}</span><span class="verdict side-${sideOf(people[1][1])}">${people[1][1]}</span><span class="figure">${figures['Ja-Anteil']}</span></p>
    ${shareBar(pct(figures['Ja-Anteil']))}
    <p class="meter-foot"><span>${figures['Ja-Stimmen']} Ja</span><span>${figures['Nein-Stimmen']} Nein</span></p>
  </div>
  <div class="meter${needed ? '' : ' unneeded'}">
    <p class="meter-head"><span class="meter-name">${cantons[0][1]}</span><span class="verdict${needed ? ` side-${sideOf(cantons[1][1])}` : ''}">${cantons[1][1]}</span><span class="figure">${cantons[2][1]}</span></p>
    ${needed ? cantonBar(rows) : ''}
    <p class="meter-foot"><span>${foot}</span></p>
  </div>
</section>`;
};

const emptyResult = `<section class="result empty">
  <p><b>Mit Ihrer Auswahl:</b> Setzen Sie eine Grenze auf ein Merkmal, und hier steht das Ergebnis der Gemeinden, die übrig bleiben.</p>
</section>`;

const legendHtml = (selection) => `<div class="legend">
  <div class="scale">
    <div class="scale-name"><span class="side-no">Nein</span><span class="secondary">Ja-Anteil in %</span><span class="side-yes">Ja</span></div>
    <div class="scale-steps">${SCALE.map((c) => `<span style="background:${c}"></span>`).join('')}</div>
    <div class="scale-ticks">${[20, 30, 40, 50, 60, 70, 80, ''].map((n) => `<span>${String(n)}</span>`).join('')}</div>
  </div>
  <ul class="keys">
    <li><span class="swatch" style="background:#f0efec"></span>Gleich viele Ja wie Nein</li>
    <li><span class="swatch" style="background-image:repeating-linear-gradient(45deg, var(--hatch) 0 2px, var(--ground) 2px 6px)"></span>Kein eigenes Ergebnis</li>
    ${selection ? '<li><span class="swatch" style="background:#2c2c2c"></span>Nicht in der Auswahl</li>' : ''}
  </ul>
</div>`;

const detailsHtml = (state) => {
  const match = /^(.*?) Ja-Anteil: ([\d.]+%)Ja-Stimmen: ([\d']+)Nein-Stimmen: ([\d']+)/.exec(
    state.details,
  );
  return `<div class="details">
  <p class="name">${match[1]}</p>
  <ul>
    <li>Ja-Anteil: ${match[2]}</li>
    <li class="details-bar">${shareBar(pct(match[2]))}</li>
    <li>Ja-Stimmen: ${match[3]}</li>
    <li>Nein-Stimmen: ${match[4]}</li>
  </ul>
</div>`;
};

const mapHtml = (state, selection) => `<section class="map">
  <h2 class="sr-only">Karte der Gemeinden</h2>
  <div class="map-frame">
    ${detailsHtml(state)}
    <div class="zoom"><button type="button" aria-label="Vergrössern">+</button><button type="button" aria-label="Verkleinern">−</button><button type="button" class="whole">Ganze Schweiz</button></div>
    ${mapSvg(state.fills, KOENIZ)}
  </div>
  ${legendHtml(selection)}
  <p class="source">Kartengrundlage: © BFS, Gemeinden und Kantone am 1. Januar 2026, Seen: ThemaKart 2026</p>
  <p class="source">Nicht auf der Karte: die Stimmen der Auslandschweizerinnen und Auslandschweizer, die 12 Kantone getrennt zählen.</p>
</section>`;

const limitHtml = (key) => {
  const h = hist[key];
  const max = Math.max(...h.bins);
  const bins = h.bins
    .map((count, i) => {
      const centre = ((i + 0.5) / h.bins.length) * 1000;
      const inside = centre >= h.lower && centre <= h.upper;
      const height = count === 0 ? 0 : Math.max(2, (count / max) * 100);
      return `<rect class="${inside ? 'in' : 'out'}" x="${String(i + 0.1)}" y="${String(100 - height)}" width="0.8" height="${String(height)}"/>`;
    })
    .join('');
  const place = h.koeniz.step / 10;
  return `<li class="limit">
  <div class="limit-head">
    <p class="label"><span class="name">${h.name}</span> <span class="date">(${h.date})</span><span class="sr-only">:</span> <span class="bounds">von ${h.lowerText} bis ${h.upperText}</span></p>
    <button type="button" class="text-button remove">Entfernen</button>
  </div>
  <svg class="hist" viewBox="0 0 ${String(h.bins.length)} 100" preserveAspectRatio="none" aria-hidden="true">${bins}</svg>
  <div class="track"><span class="range" style="left:${String(h.lower / 10)}%;right:${String(100 - h.upper / 10)}%"></span><span class="thumb" style="left:${String(h.lower / 10)}%"></span><span class="thumb" style="left:${String(h.upper / 10)}%"></span></div>
  <p class="here"><span style="left:${String(place)}%"${place < 12 ? ' class="from-left"' : ''}>Köniz: ${h.koeniz.value}</span></p>
</li>`;
};

const pickerGroups = () =>
  site.real.panel.groups.map((group) => ({
    heading: group.heading
      .replace(/,? (Ende \d+|Volkszählung \d+|\d{4})$/, '')
      .replace(/ \d{4}$/, ''),
    names: group.lines.map((line) =>
      line.slice(0, line.lastIndexOf(': ')).replace(/ \((Ende )?\d{4}\)$/, ''),
    ),
  }));

const pickerHtml = (taken) => `<div class="picker" role="dialog" aria-label="Merkmal hinzufügen">
  <div class="picker-head"><h3>Merkmal hinzufügen</h3><button type="button" class="text-button">Schliessen</button></div>
  <div class="picker-groups">${pickerGroups()
    .map((group) => {
      const names = group.names.filter((name) => !taken.includes(name));
      return names.length === 0
        ? ''
        : `<div><h4>${esc(group.heading)}</h4><ul>${names.map((name) => `<li><button type="button">${esc(name)}</button></li>`).join('')}</ul></div>`;
    })
    .join('')}</div>
</div>`;

const railHtml = (selection, { counts = true, picker = false } = {}) => {
  const count = !counts
    ? ''
    : selection
      ? `<div class="count"><p>In der Auswahl: <b>279</b> von 2'103 Gemeinden mit eigenem Ergebnis.</p><div class="count-bar"><span style="width:${String((279 / 2103) * 100)}%"></span></div></div>`
      : `<div class="count"><p>In der Auswahl: <b>2'103</b> von 2'103 Gemeinden mit eigenem Ergebnis.</p><div class="count-bar"><span style="width:100%"></span></div></div>`;
  const limits = selection
    ? `<ul class="limits">${limitHtml('foreigners')}${limitHtml('inhabitants')}</ul>`
    : '';
  return `<aside class="rail">
  <h2>Gemeinden auswählen</h2>
  <p class="intro">${INTRO}</p>
  ${count}
  ${limits}
  <div class="add-wrap"><button type="button" class="button wide add" aria-expanded="${picker ? 'true' : 'false'}">+ Merkmal hinzufügen</button>${picker ? pickerHtml(selection ? ['Ausländeranteil', 'Einwohner'] : []) : ''}</div>
  <label class="switch"><input type="checkbox" checked><span class="knob"></span><span>Auslandschweizerinnen und Auslandschweizer mitzählen (in jedem Kanton, in dem eine Gemeinde übrig ist)</span></label>
  <div class="rail-foot">${selection ? '<button type="button" class="button">Zurück zum echten Ergebnis</button>' : ''}<a href="compare.html">Mit einer anderen Abstimmung vergleichen</a></div>
</aside>`;
};

const municipalityHtml = (state) => {
  const groups = state.panel.groups
    .map((group) => {
      const rows = group.lines
        .map((line) => {
          const at = line.lastIndexOf(': ');
          const [name, value] = [line.slice(0, at), line.slice(at + 2)];
          const share = value.endsWith('%')
            ? `<i class="share" style="--share:${String(Math.min(100, pct(value)))}%"></i>`
            : '';
          return `<li><span class="row-name">${esc(name)}<span class="sr-only">: </span></span>${share}<span class="row-value">${esc(value)}</span></li>`;
        })
        .join('');
      return `<div class="group"><h4>${esc(group.heading)}</h4><ul class="rows">${rows}</ul></div>`;
    })
    .join('');
  return `<section class="municipality panel">
  <div class="section-head"><h3>Merkmale der Gemeinde</h3><p class="name">${state.panel.name}</p></div>
  <div class="groups">${groups}</div>
  <p class="source">${esc(state.panel.source)}</p>
</section>`;
};

const cantonsHtml = (state, real, selection) => {
  const realShare = Object.fromEntries(real.table.slice(1).map((row) => [row[0], row[1]]));
  const x = (share) => share;
  const row = ([canton, share, votes, side]) => {
    if (side === '–')
      return `<tr><th scope="row">${canton}</th><td>–</td><td class="none">keine Gemeinde übrig</td><td>–</td></tr>`;
    const s = pct(share);
    const bar =
      s >= 50
        ? `<i class="yes" style="width:${String(x(s) - 50)}%"></i>`
        : `<i class="no" style="width:${String(50 - x(s))}%"></i>`;
    const tick = selection
      ? `<i class="real" style="left:${String(x(pct(realShare[canton])))}%" title="Echtes Ergebnis: ${realShare[canton]}"></i>`
      : '';
    return `<tr><th scope="row">${canton}</th><td class="share-cell"><span>${share}</span><div class="diverging" aria-hidden="true">${bar}<i class="half"></i>${tick}</div></td><td class="num">${votes}</td><td class="side-${sideOf(side)}">${side}</td></tr>`;
  };
  return `<section class="cantons">
  <div class="section-head"><h3>Kantone</h3></div>
  <table class="canton-table">
    ${selection ? '<caption>Mit Ihrer Auswahl</caption>' : ''}
    <thead><tr><th scope="col">Kanton</th><th scope="col">Ja-Anteil</th><th scope="col" class="num">Standesstimmen</th><th scope="col">Seite</th></tr></thead>
    <tbody>${state.table.slice(1).map(row).join('')}</tbody>
  </table>
  <p class="canton-note">Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons${selection ? '; der Strich zeigt sein echtes Ergebnis' : ''}.</p>
</section>`;
};

const notesHtml = `<section class="section notes">
  <p>Quelle: BBl 2019 4599</p>
  <h2>Hinweis der Bundeskanzlei</h2>
  <p>Das Bundesgericht hat mit Urteilen vom 10. April 2019 die eidgenössische Volksabstimmung über die Volksinitiative vom 5. November 2012 «Für Ehe und Familie – gegen die Heiratsstrafe» aufgehoben. Mit Beschluss vom 21. Juni 2019 hat der Bundesrat die Aufhebung der Erwahrung des Ergebnisses der Volksabstimmung beschlossen (BBl 2016 3715). […]</p>
</section>`;

const voteHeadOf = (
  kind,
  date,
  needs,
  title,
) => `<a class="back" href="start.html">← Alle Abstimmungen</a>
<div class="vote-head">
  <p class="meta"><span class="tag">${kind}</span><span>${date}</span><span>${needs}</span></p>
  <h1 class="title">${esc(title)}</h1>
</div>`;

const selectionBar = `<div class="selection-bar" aria-hidden="true"><p>Mit Ihrer Auswahl: <b class="side-yes">Angenommen</b></p><p>Volksmehr: <span class="side-yes">Ja</span> · Ständemehr: <span class="side-yes">Ja</span></p></div>`;

// ---------- A vote's page ----------
const votePage = (selection) => {
  const state = selection ? site.selection : site.real;
  const results = `<div class="results">${resultHtml('Echtes Ergebnis', site.real.results[0], site.real.table.slice(1))}${
    selection
      ? resultHtml('Mit Ihrer Auswahl', site.selection.results[1], site.selection.table.slice(1))
      : emptyResult
  }</div>`;
  const file = `vote-b${selection ? '' : '-real'}.html`;
  return page({
    title: 'Entwurf: eine Abstimmung',
    bodyClass: 'layout-b',
    current: 'vote',
    file,
    body: `<main class="page">${voteHeadOf('Volksinitiative', '28. Februar 2016', 'Braucht das Volksmehr und das Ständemehr.', site.real.title)}
  <div class="workspace">
    <div class="watch">${results}${mapHtml(state, selection)}</div>
    ${railHtml(selection)}
  </div>
  <div class="below">${municipalityHtml(state)}${cantonsHtml(state, site.real, selection)}</div>
  ${notesHtml}
</main>${selection ? selectionBar : ''}`,
  });
};

// ---------- The comparison ----------
const comparePage = () => {
  const compared = (label, chosen, real, selection, extra = '') => `<section class="compared">
  <label class="choose"><span>${label}</span><select><option>${esc(chosen)}</option></select></label>
  <div class="results">${resultHtml('Echtes Ergebnis', real.results[0], real.table.slice(1))}${resultHtml('Mit Ihrer Auswahl', selection.results[1], selection.table.slice(1))}</div>
  <p class="compared-count">In der Auswahl: 279 von 2'103 Gemeinden mit eigenem Ergebnis.</p>
  ${extra}
</section>`;
  const title = (data) => `28. Februar 2016 · ${data.title}`;
  return page({
    title: 'Entwurf: zwei Abstimmungen vergleichen',
    bodyClass: 'layout-b compare',
    current: 'compare',
    file: 'compare.html',
    body: `<main class="page">
  <div class="vote-head"><h1 class="title">Zwei Abstimmungen vergleichen</h1></div>
  <div class="workspace">
    <div class="watch">
      ${compared('Erste Abstimmung', title(site.real), site.real, site.selection, '<p class="source">Quelle: BBl 2019 4599. Hinweis der Bundeskanzlei: Das Bundesgericht hat mit Urteilen vom 10. April 2019 die eidgenössische Volksabstimmung […] aufgehoben.</p>')}
      ${compared('Zweite Abstimmung', title(more.second), more.second, more.secondSelection, '<p class="source">Quelle: BBl 2016 3715</p>')}
      <p class="same">Die Gemeinden werden nach den Zahlen der ersten Abstimmung ausgewählt; in beiden Abstimmungen zählen dieselben Gemeinden.</p>
    </div>
    ${railHtml(true, { counts: false })}
  </div>
</main><div class="selection-bar" aria-hidden="true"><p>Erste Abstimmung: <b class="side-yes">Angenommen</b></p><p>Zweite Abstimmung: <b class="side-no">Abgelehnt</b></p></div>`,
  });
};

// ---------- The guide ----------
const guidePage = () => {
  const sections = [...guideHtml.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)]
    .map((match) =>
      match[1]
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/ class="[^"]*"/g, '')
        .replace(/href="[^"]*"/g, 'href="#"'),
    )
    .map((html) => `<section>${html}</section>`)
    .join('');
  return page({
    title: 'Entwurf: Lesehilfe',
    bodyClass: 'guide',
    current: 'guide',
    file: 'guide.html',
    body: `<main class="page"><a class="back" href="start.html">← Alle Abstimmungen</a><div class="vote-head"><h1 class="title">Lesehilfe</h1></div><div class="prose">${sections}</div></main>`,
  });
};

// ---------- Single states ----------
const partsPage = () => {
  const optional = more.optionalSelection;
  const tie = [
    ["Für die Initiative: 1'098'341 (37.36%)", 37.36],
    ["Für den Gegenentwurf: 1'841'208 (62.64%)", 62.64],
  ];
  return page({
    title: 'Entwurf: einzelne Zustände',
    bodyClass: 'layout-b parts',
    current: 'vote',
    file: 'parts.html',
    body: `<main class="page">
  <p class="part-note">Eine Abstimmung, die nur das Volksmehr braucht, mit einer Auswahl (ohne die Auslandschweizerinnen und Auslandschweizer)</p>
  ${voteHeadOf('Fakultatives Referendum', '28. September 2025', 'Braucht nur das Volksmehr.', optional.title)}
  <div class="results narrow">${resultHtml('Echtes Ergebnis', optional.results[0], optional.table.slice(1))}${resultHtml('Mit Ihrer Auswahl', optional.results[1], optional.table.slice(1))}</div>

  <p class="part-note">Die Stichfrage: keine Urteile, keine Karte, die Zahlen in der Farbe des Textes</p>
  ${voteHeadOf('Stichfrage', '8. März 2026', '', more.tiebreak.title)}
  <div class="tiebreak">
    ${tie.map(([text]) => `<p>${text}</p>`).join('')}
    <div class="bar neutral"><span class="yes" style="width:37.36%"></span><span class="no"></span><i class="half"></i></div>
    <p>Stände: 2 für die Initiative, 21 für den Gegenentwurf</p>
    <p class="secondary">Die Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen sind; sie wird hier nicht beurteilt.</p>
    <p class="secondary">Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt.</p>
  </div>

  <p class="part-note">«Merkmal hinzufügen», geöffnet: die 35 Merkmale unter ihren acht Überschriften; ein Klick fügt die Grenze hinzu</p>
  <div class="picker-demo">${railHtml(true, { picker: true })}</div>
</main>`,
  });
};

// ---------- The start page ----------
const startPage = () => {
  const years = site.start
    .map((year) => {
      const days = [];
      for (const entry of year.entries) {
        const parts = entry.parts;
        const date = parts[0][1].replace(` ${year.year}`, '');
        const [title, kind, result] = [parts[1][1], parts[2][1], parts[3]];
        const marks = parts
          .slice(4)
          .map((part) => ` <span class="tag">${part[1]}</span>`)
          .join('');
        const side = result[0] === 'side-yes' ? 'yes' : result[0] === 'side-no' ? 'no' : null;
        const share = /([\d.]+%)/.exec(result[1])[1];
        const name = `<span class="vote-title">${esc(title)}<span class="vote-kind">${esc(kind)}</span></span>`;
        const row =
          side === null
            ? `<a class="vote-row" href="parts.html" data-side="none">${name}<span class="bar" style="visibility:hidden"></span><span class="vote-share">${share}</span><span class="vote-verdict plain">für die Initiative${marks}</span></a>`
            : `<a class="vote-row" href="vote-b-real.html" data-side="${side}">${name}${shareBar(pct(share))}<span class="vote-share">${share} Ja</span><span class="vote-verdict side-${side}">${side === 'yes' ? 'angenommen' : 'abgelehnt'}${marks}</span></a>`;
        if (days.length === 0 || days.at(-1).date !== date) days.push({ date, rows: [] });
        days.at(-1).rows.push(row);
      }
      return `<section class="year" id="y${year.year}"><h3>${year.year}</h3><div>${days
        .map(
          (day) =>
            `<div class="day"><p class="day-date">${day.date}</p><div>${day.rows.join('')}</div></div>`,
        )
        .join('')}</div></section>`;
    })
    .join('');
  const body = `<main class="page">
  <section class="hero plain">
    <h1>Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen wäre?</h1>
    <p class="lead">Wählen Sie eine Abstimmung und grenzen Sie die Gemeinden ein: nach Einwohnerzahl, Alter, Parteistärke und 32 weiteren Merkmalen. Karte und Ergebnis rechnen sofort neu. Ein Gedankenexperiment, keine Prognose.</p>
  </section>
  <section class="votes">
    <div class="toolbar">
      <h2>Alle Abstimmungen seit 2013</h2>
      <input class="search" type="search" placeholder="Titel suchen" aria-label="Titel suchen">
      <div class="chips" role="group" aria-label="Ergebnis">
        <button type="button" class="chip" aria-pressed="true" data-side="all">Alle</button>
        <button type="button" class="chip" aria-pressed="false" data-side="yes">Angenommen</button>
        <button type="button" class="chip" aria-pressed="false" data-side="no">Abgelehnt</button>
      </div>
      <nav class="years" aria-label="Jahre">${site.start.map((year) => `<a href="#y${year.year}">${year.year}</a>`).join('')}</nav>
    </div>
    ${years}
    <p class="no-match">Keine Abstimmung passt zu dieser Suche.</p>
  </section>
</main>`;
  const script = `<script>
  const search = document.querySelector('.search');
  const chips = [...document.querySelectorAll('.chip')];
  let side = 'all';
  const apply = () => {
    const words = search.value.trim().toLowerCase();
    let shown = 0;
    for (const row of document.querySelectorAll('.vote-row')) {
      const match = (side === 'all' || row.dataset.side === side) && row.textContent.toLowerCase().includes(words);
      row.hidden = !match;
      row.style.display = match ? '' : 'none';
      if (match) shown++;
    }
    for (const day of document.querySelectorAll('.day')) day.style.display = day.querySelector('.vote-row:not([hidden])') ? '' : 'none';
    for (const year of document.querySelectorAll('.year')) year.style.display = year.querySelector('.vote-row:not([hidden])') ? '' : 'none';
    document.querySelector('.no-match').style.display = shown === 0 ? 'block' : 'none';
  };
  search.addEventListener('input', apply);
  for (const chip of chips) chip.addEventListener('click', () => {
    side = chip.dataset.side;
    for (const other of chips) other.setAttribute('aria-pressed', String(other === chip));
    apply();
  });
</script>`;
  return page({
    title: 'Entwurf: Startseite',
    bodyClass: 'start',
    current: 'start',
    file: 'start.html',
    body,
    script,
  });
};

mkdirSync(out, { recursive: true });
const files = {
  'vote-b.html': votePage(true),
  'vote-b-real.html': votePage(false),
  'start.html': startPage(),
  'compare.html': comparePage(),
  'guide.html': guidePage(),
  'parts.html': partsPage(),
};
for (const [file, html] of Object.entries(files)) {
  writeFileSync(join(out, file), html);
  console.log('wrote', file, String(Math.round(html.length / 1024)), 'KB');
}
