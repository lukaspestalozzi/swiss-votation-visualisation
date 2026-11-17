<script lang="ts">
  import { onMount } from 'svelte';
  import type { MapSources } from '../../../lib/map-data.ts';
  import { loadCharacteristics, loadMap } from './loaders.ts';
  import type { CharacteristicsFile } from '../../../lib/vote-data.ts';
  import CharacteristicsPanel from './CharacteristicsPanel.svelte';
  import {
    HATCH_BACKGROUND,
    HATCH_LINE,
    LAKE_COLOUR,
    SET_ASIDE_COLOUR,
    colourOf,
    colouringOf,
    detailsOf,
    legendOf,
    legendSetAsideOf,
    type VoteEntries,
  } from '../../../lib/result-map.ts';
  import { formatDate } from '../../../lib/format.ts';
  import { moveBy, wholeView, zoomAround, type View } from '../../../lib/map-view.ts';
  import type { Texts } from '../../../lib/texts/index.ts';

  // The map of a vote (spec result-map): its entries are written into the page when the site is
  // built; the shapes and the names are loaded in the browser.
  let {
    t,
    entries,
    aside,
    title,
    voteDate,
  }: {
    t: Texts;
    entries: VoteEntries;
    // The municipalities the selection sets aside (spec limits).
    aside: ReadonlySet<number>;
    title: string;
    voteDate: string;
  } = $props();

  // Each municipality's [number, yes, no], from the entries of every canton.
  const figures = $derived(entries.cantons.flatMap((canton) => canton.municipalities));
  // The entries of Swiss abroad, which are not on the map.
  const swissAbroad = $derived(entries.cantons.filter((canton) => canton.abroad !== null).length);

  // The loaded files are raw state: a new value replaces the old one whole, and nothing changes
  // them inside, which spares the proxies of deep state (design of tighten-map-budget, decision 2).
  let sources = $state.raw<MapSources | null>(null);
  // The part of the map shown, as the SVG's view box; the whole of Switzerland at first.
  let view = $state<View | null>(null);
  // Whether the shapes or the names could not be loaded.
  let failed = $state(false);
  // The characteristics, null until they are loaded, and whether they could not be.
  let characteristics = $state.raw<CharacteristicsFile | null>(null);
  let characteristicsFailed = $state(false);

  // The fill of each municipality by its number: its class, or the hatching without a result.
  const fills = $derived(
    new Map<number, string>([
      ...figures.map(([number, yes, no]): [number, string] => [
        number,
        colourOf(colouringOf(yes, no)),
      ]),
      ...entries.withoutResult.map((number): [number, string] => [number, 'url(#hatch)']),
    ]),
  );

  // The set-aside municipalities are painted apart from the colours above: only those whose state
  // changed get a new fill, as building all 2,110 fills again at every step of a drag took most of
  // a frame (investigations/limits.md, 8). The paths are found by their number once.
  let group = $state<SVGGElement | null>(null);
  let pathOf: ReadonlyMap<number, Element> | null = null;
  let painted: ReadonlySet<number> = new Set();
  $effect(() => {
    if (group === null) return;
    pathOf ??= new Map(
      [...group.querySelectorAll('path[data-number]')].map((path) => [
        Number(path.getAttribute('data-number')),
        path,
      ]),
    );
    for (const number of painted) {
      if (!aside.has(number)) pathOf.get(number)?.setAttribute('fill', fills.get(number) ?? '');
    }
    for (const number of aside) {
      if (!painted.has(number)) pathOf.get(number)?.setAttribute('fill', SET_ASIDE_COLOUR);
    }
    painted = aside;
  });

  // The name and the canton of each municipality, by its number.
  const names = $derived(
    new Map(
      sources === null
        ? []
        : Object.entries(sources.municipalities.municipalities).flatMap(([canton, rows]) =>
            rows.map(([number, name]) => [number, { name, canton }] as const),
          ),
    ),
  );
  const counts = $derived(
    new Map(figures.map(([number, yes, no]) => [number, [yes, no] as const])),
  );

  // The municipality pointed at, or clicked or tapped; and the one last clicked or tapped, which
  // the panel shows (design of add-characteristics, decision 14).
  let selected = $state<number | null>(null);
  let last = $state<number | null>(null);
  const details = $derived.by(() => {
    const named = selected === null ? undefined : names.get(selected);
    if (selected === null || named === undefined) return null;
    const shown = detailsOf(named.name, named.canton, counts.get(selected) ?? null, t);
    // A municipality the selection sets aside says so after its own figures (spec result-map).
    return aside.has(selected) ? { ...shown, lines: [...shown.lines, t.SET_ASIDE] } : shown;
  });
  // The legend, which names the set-aside municipalities while there are any.
  const legend = $derived(aside.size > 0 ? [...legendOf(t), legendSetAsideOf(t)] : legendOf(t));
  const lastName = $derived.by(() => {
    const named = last === null ? undefined : names.get(last);
    if (last === null || named === undefined) return null;
    return detailsOf(named.name, named.canton, null, t).name;
  });

  function showWholeSwitzerland(): void {
    if (sources !== null) view = wholeView(sources.map);
  }

  /** Zoom by `factor` around the centre of the view. */
  function zoom(factor: number): void {
    if (sources === null || view === null) return;
    const centre = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    view = zoomAround(view, factor, centre, sources.map);
  }

  /**
   * The wheel over the map zooms around the point under the pointer, a factor of 2 per 300
   * pixels of the wheel, and the page does not scroll. The listener is not passive, so that it
   * may keep the page from scrolling.
   */
  function wheelZoom(svg: SVGSVGElement): () => void {
    const onWheel = (event: WheelEvent): void => {
      const matrix = svg.getScreenCTM();
      if (sources === null || view === null || matrix === null) return;
      event.preventDefault();
      const pixels =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      view = zoomAround(view, 2 ** (-pixels / 300), point, sources.map);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheel);
    };
  }

  // A press on the map: where it began, the view then, and whether it has become a drag, after
  // more than 4 pixels (design of add-result-map, decision 17).
  let press: { x: number; y: number; view: View; moved: boolean } | null = null;
  // After a drag, its release selects nothing, until the pointer moves from where it was let go.
  let released: { x: number; y: number } | null = null;

  function down(event: PointerEvent): void {
    if (view === null || event.button !== 0) return;
    press = { x: event.clientX, y: event.clientY, view, moved: false };
    // A new press ends the last drag's hold: its own click counts unless it becomes a drag.
    released = null;
  }

  function drag(event: PointerEvent & { currentTarget: SVGSVGElement }): void {
    // A press let go outside the map, before it became a drag, sent no release here.
    if (press !== null && (event.buttons & 1) === 0) press = null;
    if (press === null || sources === null) {
      if (released !== null && (event.clientX !== released.x || event.clientY !== released.y)) {
        // The first move after a drag points again, also within the municipality it ended on.
        released = null;
        point(event);
      }
      return;
    }
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.moved) {
      if (Math.hypot(dx, dy) <= 4) return;
      press.moved = true;
      selected = null;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const pixelsWide = event.currentTarget.getBoundingClientRect().width;
    view = moveBy(press.view, dx, dy, pixelsWide, sources.map);
  }

  function up(event: PointerEvent): void {
    if (press?.moved === true) released = { x: event.clientX, y: event.clientY };
    press = null;
  }

  /** Pointing or clicking, but not as part of a drag. */
  function pointUnlessDragged(event: Event): void {
    if (press?.moved === true || released !== null) return;
    point(event);
  }

  /** The municipality under the pointer, or none over a lake or outside Switzerland. */
  function point(event: Event): void {
    const target = event.target;
    const number = target instanceof SVGPathElement ? target.dataset.number : undefined;
    selected = number === undefined ? null : Number(number);
    if (event.type === 'click' && selected !== null) last = selected;
  }

  onMount(() => {
    loadCharacteristics().then(
      (loaded) => {
        characteristics = loaded;
      },
      () => {
        characteristicsFailed = true;
      },
    );
    loadMap().then(
      (loaded) => {
        sources = loaded;
        view = wholeView(loaded.map);
      },
      () => {
        failed = true;
      },
    );
  });
</script>

<section class="map">
  <h2>{t.MAP_HEADING}</h2>
  {#if failed}
    <p>{t.MAP_FAILED}</p>
  {/if}
  {#if sources !== null}
    {@const map = sources.map}
    <div class="beside">
      <div class="frame">
        <div class="details" aria-live="polite">
          {#if details !== null}
            <p class="name">{details.name}</p>
            <ul>
              {#each details.lines as line (line)}
                <li>{line}</li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="zoom">
          <button
            type="button"
            aria-label={t.ZOOM_IN}
            onclick={() => {
              zoom(2);
            }}>+</button
          >
          <button
            type="button"
            aria-label={t.ZOOM_OUT}
            onclick={() => {
              zoom(0.5);
            }}>−</button
          >
          <button type="button" onclick={showWholeSwitzerland}>{t.WHOLE_SWITZERLAND}</button>
        </div>
        <!-- Pointing and clicking show a municipality's details; without a pointer the table of the
           cantons gives the figures, and reading a municipality's details without one is #10's
           (design of add-result-map, decision 20). -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <svg
          {@attach wheelZoom}
          role="img"
          aria-label={t.mapLabel(title)}
          viewBox={view === null
            ? undefined
            : `${String(view.x)} ${String(view.y)} ${String(view.width)} ${String(view.height)}`}
          onpointerover={pointUnlessDragged}
          onclick={pointUnlessDragged}
          onpointerdown={down}
          onpointermove={drag}
          onpointerup={up}
          onpointercancel={() => (press = null)}
          onpointerleave={() => (selected = null)}
        >
          <defs>
            <!-- In metres of the map: a line every 1.5 km, a third of it wide. -->
            <pattern
              id="hatch"
              width="1500"
              height="1500"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="1500" height="1500" fill={HATCH_BACKGROUND} />
              <line x1="0" y1="0" x2="0" y2="1500" stroke={HATCH_LINE} stroke-width="500" />
            </pattern>
          </defs>
          <!-- Switzerland in the lakes' colour: every hole of the municipalities shows as water. -->
          <path class="outline" d={map.outline} fill={LAKE_COLOUR} />
          <g class="municipalities" bind:this={group}>
            {#each map.municipalities as [number, path] (number)}
              <path d={path} data-number={number} fill={fills.get(number)} />
            {/each}
          </g>
          <g class="lakes">
            {#each map.lakes as path, i (i)}
              <path d={path} fill={LAKE_COLOUR} />
            {/each}
          </g>
          <g class="cantons">
            {#each map.cantons as [canton, path] (canton)}
              <path d={path} data-canton={canton} />
            {/each}
          </g>
        </svg>
      </div>
      <CharacteristicsPanel
        {t}
        file={characteristics}
        failed={characteristicsFailed}
        number={last}
        name={lastName}
        {voteDate}
      />
    </div>
    <ul class="legend">
      {#each legend as entry (entry.label)}
        <li>
          {#if entry.fill === 'hatch'}
            <span
              class="swatch"
              style:background-image="repeating-linear-gradient(45deg, {HATCH_LINE} 0 2px, {HATCH_BACKGROUND}
              2px 6px)"
            ></span>
          {:else}
            <span class="swatch" style:background-color={entry.fill}></span>
          {/if}
          {entry.label}
        </li>
      {/each}
    </ul>
    <p class="source">{t.mapSource(formatDate(map.referenceDate, t), map.lakesSet)}</p>
    {#if swissAbroad > 0}
      <p>{t.swissAbroadNotOnTheMap(swissAbroad)}</p>
    {/if}
  {/if}
</section>

<style>
  /* The panel to the right of the map in a window at least 960 pixels wide, below it otherwise
     (spec result-map, "Where the panel stands"). */
  .beside {
    display: grid;
    gap: 1rem;
  }
  @media (min-width: 960px) {
    .beside {
      grid-template-columns: minmax(0, 1fr) 20rem;
      align-items: start;
    }
  }
  .frame {
    position: relative;
  }
  /* The details of the municipality pointed at, at the top left: nothing moves with the mouse. */
  .details {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 0.5rem;
    background: rgb(255 255 255 / 90%);
    pointer-events: none;
  }
  .zoom {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: 0.25rem;
  }
  .details:empty {
    display: none;
  }
  .details ul {
    margin: 0 0 0.5rem;
    padding: 0;
    list-style: none;
  }
  .name {
    margin: 0.5rem 0 0;
    font-weight: bold;
  }
  /* Borders keep their width on the screen at every zoom. */
  .municipalities path {
    stroke: #fff;
    stroke-width: 0.5px;
    vector-effect: non-scaling-stroke;
  }
  .cantons path {
    fill: none;
    stroke: #333;
    stroke-width: 1.5px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    padding: 0;
    list-style: none;
  }
  .swatch {
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 0.25rem;
    vertical-align: middle;
    border: 1px solid #767676;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
