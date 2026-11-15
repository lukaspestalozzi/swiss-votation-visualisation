<script module lang="ts">
  import { asset } from '$app/paths';
  import { createMapLoader } from '../../../lib/map-data.ts';

  // One loader for every vote's page, so the files are requested once per visit.
  const loadMap = createMapLoader(
    { map: asset('data/map.json'), municipalities: asset('data/municipalities.json') },
    (url) => fetch(url),
  );
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import type { MapSources } from '../../../lib/map-data.ts';
  import {
    HATCH_BACKGROUND,
    HATCH_LINE,
    LAKE_COLOUR,
    LEGEND,
    colourOf,
    colouringOf,
    detailsOf,
    type MapFigures,
  } from '../../../lib/result-map.ts';
  import { formatDate } from '../../../lib/format.ts';
  import { moveBy, wholeView, zoomAround, type View } from '../../../lib/map-view.ts';
  import {
    MAP_FAILED,
    MAP_HEADING,
    WHOLE_SWITZERLAND,
    ZOOM_IN,
    ZOOM_OUT,
    mapLabel,
    mapSource,
    swissAbroadNotOnTheMap,
  } from '../../../lib/texts.ts';

  // The map of a vote (spec result-map): its figures are written into the page when the site is
  // built; the shapes and the names are loaded in the browser.
  let { figures, title }: { figures: MapFigures; title: string } = $props();

  let sources = $state<MapSources | null>(null);
  // The part of the map shown, as the SVG's view box; the whole of Switzerland at first.
  let view = $state<View | null>(null);
  // Whether the shapes or the names could not be loaded.
  let failed = $state(false);

  // The fill of each municipality by its number: its class, or the hatching without a result.
  const fills = $derived(
    new Map<number, string>([
      ...figures.figures.map(([number, yes, no]): [number, string] => [
        number,
        colourOf(colouringOf(yes, no)),
      ]),
      ...figures.withoutResult.map((number): [number, string] => [number, 'url(#hatch)']),
    ]),
  );

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
    new Map(figures.figures.map(([number, yes, no]) => [number, [yes, no] as const])),
  );

  // The municipality pointed at, or clicked or tapped.
  let selected = $state<number | null>(null);
  const details = $derived.by(() => {
    const named = selected === null ? undefined : names.get(selected);
    if (selected === null || named === undefined) return null;
    return detailsOf(named.name, named.canton, counts.get(selected) ?? null);
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
  }

  function drag(event: PointerEvent & { currentTarget: SVGSVGElement }): void {
    if (press === null || sources === null) {
      if (released !== null && (event.clientX !== released.x || event.clientY !== released.y)) {
        released = null;
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
  }

  onMount(() => {
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
  <h2>{MAP_HEADING}</h2>
  {#if failed}
    <p>{MAP_FAILED}</p>
  {/if}
  {#if sources !== null}
    {@const map = sources.map}
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
          aria-label={ZOOM_IN}
          onclick={() => {
            zoom(2);
          }}>+</button
        >
        <button
          type="button"
          aria-label={ZOOM_OUT}
          onclick={() => {
            zoom(0.5);
          }}>−</button
        >
        <button type="button" onclick={showWholeSwitzerland}>{WHOLE_SWITZERLAND}</button>
      </div>
      <!-- Pointing and clicking show a municipality's details; without a pointer the table of the
           cantons gives the figures, and reading a municipality's details without one is #10's
           (design of add-result-map, decision 20). -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <svg
        {@attach wheelZoom}
        role="img"
        aria-label={mapLabel(title)}
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
        <g class="municipalities">
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
    <ul class="legend">
      {#each LEGEND as entry (entry.label)}
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
    <p class="source">{mapSource(formatDate(map.referenceDate), map.lakesSet)}</p>
    {#if figures.swissAbroad > 0}
      <p>{swissAbroadNotOnTheMap(figures.swissAbroad)}</p>
    {/if}
  {/if}
</section>

<style>
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
