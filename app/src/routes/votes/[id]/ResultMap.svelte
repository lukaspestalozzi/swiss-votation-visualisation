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
  import { MAP_HEADING, mapSource, swissAbroadNotOnTheMap } from '../../../lib/texts.ts';

  // The map of a vote (spec result-map): its figures are written into the page when the site is
  // built; the shapes and the names are loaded in the browser.
  let { figures }: { figures: MapFigures } = $props();

  let sources = $state<MapSources | null>(null);

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

  /** The municipality under the pointer, or none over a lake or outside Switzerland. */
  function point(event: Event): void {
    const target = event.target;
    const number = target instanceof SVGPathElement ? target.dataset.number : undefined;
    selected = number === undefined ? null : Number(number);
  }

  onMount(() => {
    void loadMap().then((loaded) => (sources = loaded));
  });
</script>

<section class="map">
  <h2>{MAP_HEADING}</h2>
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
      <!-- Pointing and clicking show a municipality's details; without a pointer the table of the
           cantons gives the figures, and reading a municipality's details without one is #10's
           (design of add-result-map, decision 20). -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <svg
        viewBox="0 0 {map.width} {map.height}"
        onpointerover={point}
        onclick={point}
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
