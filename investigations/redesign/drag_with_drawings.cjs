// The frames of a drag of a limit on today's page of a vote, without and with the drawings the
// redesign adds: the result as two bars, the cantonal votes as segments, a bar per canton, the
// count's bar and a histogram of 50 bins per limit. The drawings are added to the page by this
// script and redrawn in the frame of every step, from what the page writes; the app itself would
// have the values at hand, so this costs more than the app would.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/drag_with_drawings.cjs [--runs 10] [--steps 20] [--limits 1] [--phone]
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const RUNS = Number(option('--runs', '10'));
const STEPS = Number(option('--steps', '20'));
const LIMITS = Number(option('--limits', '1'));
const PHONE = args.includes('--phone');

// As the browser tests' MEASURE_FRAMES (app/e2e/frames.ts).
const MEASURE = `
  window.__frames = [];
  const started = new WeakMap();
  for (const type of ['pointermove', 'input']) {
    window.addEventListener(type, (event) => {
      const entry = { type, start: performance.now(), handled: 0 };
      started.set(event, entry);
      requestAnimationFrame(() => {
        const frame = performance.now();
        setTimeout(() => {
          const handlers = (entry.handled || frame) - entry.start;
          window.__frames.push({ type, work: Math.max(0, handlers) + (performance.now() - frame) });
        });
      });
    }, { capture: true, passive: true });
    window.addEventListener(type, (event) => {
      const entry = started.get(event);
      if (entry) entry.handled = performance.now();
    }, { passive: true });
  }
`;

// The drawings: built once, redrawn after every input in the frame that follows it.
const drawings = (limits) => {
  const box = document.createElement('div');
  box.id = 'drawings';
  box.style.cssText = 'display:grid;gap:8px;max-width:800px;margin:8px 0';
  const bar = () => {
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;height:14px;background:#e4e4e4';
    return el;
  };
  const span = (parent, colour) => {
    const el = document.createElement('span');
    el.style.background = colour;
    parent.append(el);
    return el;
  };
  // Two results, each a bar of the voters and 26 segments of the cantons.
  const results = [0, 1].map(() => {
    const share = bar();
    const yes = span(share, '#009c86');
    span(share, '#c2673b').style.flex = '1';
    const cantons = bar();
    const segments = Array.from({ length: 26 }, () => span(cantons, '#009c86'));
    box.append(share, cantons);
    return { yes, segments };
  });
  // The count's bar.
  const count = bar();
  const counted = span(count, '#1c1c1c');
  box.append(count);
  // A histogram of 50 bins per limit.
  const histograms = Array.from({ length: limits }, () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 50 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'width:100%;height:40px';
    const bins = Array.from({ length: 50 }, (_, i) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(i + 0.1));
      rect.setAttribute('width', '0.8');
      const height = 10 + ((i * 37) % 90);
      rect.setAttribute('y', String(100 - height));
      rect.setAttribute('height', String(height));
      svg.append(rect);
      return rect;
    });
    box.append(svg);
    return bins;
  });
  // A bar per canton.
  const rows = Array.from({ length: 26 }, () => {
    const row = bar();
    row.style.height = '10px';
    box.append(row);
    return span(row, '#009c86');
  });
  document.querySelector('h1').after(box);

  const number = (text) => Number(text.replace(/[^0-9.]/g, ''));
  const redraw = () => {
    const boxes = [...document.querySelectorAll('.result')];
    const table = [...document.querySelectorAll('table tbody tr, table tr')].filter(
      (row) => row.children[0].tagName === 'TD',
    );
    boxes.forEach((result, i) => {
      const share = number(result.querySelectorAll('.figures dd')[2].textContent);
      results[i].yes.style.width = share + '%';
      table.forEach((row, j) => {
        const side = row.children[3].textContent.trim();
        const segment = results[i].segments[j];
        segment.style.flex = row.children[2].textContent.trim() === '½' ? '1' : '2';
        segment.style.background =
          side === 'Ja' ? '#009c86' : side === 'Nein' ? '#c2673b' : 'transparent';
      });
    });
    const sentence = [...document.querySelectorAll('p')].find((p) =>
      p.textContent.includes('Gemeinden mit eigenem Ergebnis'),
    );
    const [n, m] = sentence ? sentence.textContent.match(/[\d']+/g).map(number) : [0, 1];
    counted.style.width = (100 * n) / m + '%';
    const sliders = [...document.querySelectorAll('input[type=range]')];
    histograms.forEach((bins, k) => {
      const lower = Number(sliders[2 * k]?.value ?? 0);
      const upper = Number(sliders[2 * k + 1]?.value ?? 1000);
      bins.forEach((rect, i) => {
        const centre = (i + 0.5) * 20;
        rect.setAttribute('fill', centre >= lower && centre <= upper ? '#1c1c1c' : '#8c8c8c');
      });
    });
    table.forEach((row, j) => {
      const share = number(row.children[1].textContent);
      rows[j].style.marginLeft = share >= 50 ? '50%' : Math.max(0, 50 - (50 - share) * 3.33) + '%';
      rows[j].style.width = Math.min(50, Math.abs(share - 50) * 3.33) + '%';
      rows[j].style.background = share >= 50 ? '#009c86' : '#c2673b';
    });
  };
  window.addEventListener('input', () => requestAnimationFrame(redraw));
  redraw();
};

async function drag(browser, withDrawings) {
  const context = await browser.newContext(
    PHONE ? { ...devices['Pixel 7'] } : { viewport: { width: 1280, height: 900 } },
  );
  const page = await context.newPage();
  await page.addInitScript(MEASURE);
  await page.goto(BASE + 'de/votes/5960/');
  const list = page.getByLabel('Merkmal hinzufügen');
  await list.waitFor();
  const names = ['Einwohner', 'Ausländeranteil', 'SVP', '65 Jahre und älter', 'Fläche'].slice(
    0,
    LIMITS,
  );
  for (const name of names) {
    await list.selectOption({ label: name });
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  }
  // A selection from the start, so that both results and the selection's table are drawn.
  const upper = page.getByRole('slider', { name: 'Obere Grenze: Einwohner', exact: true });
  await upper.focus();
  await page.keyboard.press('ArrowLeft');
  await page.evaluate(() => document.fonts.ready);
  if (withDrawings) await page.evaluate(drawings, LIMITS);
  const lower = page.getByRole('slider', { name: 'Untere Grenze: Einwohner', exact: true });
  await lower.scrollIntoViewIfNeeded();
  const box = await lower.boundingBox();
  const y = box.y + box.height / 2;
  const [left, right] = [box.x + 10, box.x + box.width * 0.9];
  await page.mouse.move(left, y);
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    window.__frames = [];
  });
  await page.mouse.down();
  await page.mouse.move(right, y, { steps: STEPS });
  await page.mouse.move(left, y, { steps: STEPS });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const frames = await page.evaluate(() => window.__frames);
  const drawn = withDrawings
    ? await page.evaluate(() => document.querySelectorAll('#drawings *').length)
    : 0;
  await context.close();
  return { frames, drawn };
}

(async () => {
  const browser = await chromium.launch();
  for (const withDrawings of [false, true]) {
    const longest = [];
    const medians = [];
    let drawn = 0;
    let inputs = 0;
    for (let run = 1; run <= RUNS; run += 1) {
      const result = await drag(browser, withDrawings);
      const work = result.frames
        .filter((f) => f.type === 'input')
        .map((f) => f.work)
        .sort((a, b) => b - a);
      longest.push(work[0]);
      medians.push(work[Math.floor(work.length / 2)]);
      drawn = result.drawn;
      inputs = work.length;
    }
    const mean = (xs) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
    console.log(
      `${withDrawings ? `with the drawings (${String(drawn)} elements)` : 'today'}, ${String(LIMITS)} limit(s)${PHONE ? ', phone' : ''}: ` +
        `${String(RUNS)} runs of ${String(inputs)} input frames; longest frame of a run ${mean(longest)} ms on average, ` +
        `from ${Math.min(...longest).toFixed(1)} to ${Math.max(...longest).toFixed(1)}; median frame ${mean(medians)} ms; ` +
        `runs with a frame over 16 ms: ${String(longest.filter((ms) => ms > 16).length)}`,
    );
  }
  await browser.close();
})();
