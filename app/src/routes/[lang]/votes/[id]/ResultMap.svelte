<script lang="ts">
  import { onMount } from 'svelte';
  import type { MapSources } from '../../../../lib/map-data.ts';
  import { loadMap } from './loaders.ts';
  import {
    HATCH_LINE,
    LAKE_COLOUR,
    SET_ASIDE_COLOUR,
    colourOf,
    colouringOf,
    detailsOf,
    legendOf,
    legendSetAsideOf,
    type VoteEntries,
  } from '../../../../lib/result-map.ts';
  import {
    moveBy,
    pinchFrom,
    wholeView,
    zoomAround,
    type Fingers,
    type Point,
    type View,
  } from '../../../../lib/map-view.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';

  // The map of a vote (spec result-map) with its legend: its entries are written into the page
  // when the site is built; the shapes and the names are loaded in the browser. The lines below
  // it are `MapNotes.svelte`'s.
  let {
    t,
    entries,
    aside,
    title,
    clicked = $bindable(null),
  }: {
    t: Texts;
    entries: VoteEntries;
    // The municipalities the selection sets aside (spec limits).
    aside: ReadonlySet<number>;
    title: string;
    // The municipality last clicked or tapped, with its name as its details write it: the page
    // shows its characteristics below the map (design of redesign-site, decision 17).
    clicked?: { readonly number: number; readonly name: string } | null;
  } = $props();

  // Each municipality's [number, yes, no], from the entries of every canton.
  const figures = $derived(entries.cantons.flatMap((canton) => canton.municipalities));

  // The loaded files are raw state: a new value replaces the old one whole, and nothing changes
  // them inside, which spares the proxies of deep state (design of tighten-map-budget, decision 2).
  let sources = $state.raw<MapSources | null>(null);
  // The part of the map shown, as the SVG's view box; the whole of Switzerland at first.
  let view = $state<View | null>(null);
  // Whether the shapes or the names could not be loaded.
  let failed = $state(false);

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

  // The municipality pointed at, or clicked or tapped. The one last clicked or tapped is
  // `clicked`, which the panel shows (design of add-characteristics, decision 14).
  let selected = $state<number | null>(null);
  const details = $derived.by(() => {
    const named = selected === null ? undefined : names.get(selected);
    if (selected === null || named === undefined) return null;
    const shown = detailsOf(named.name, named.canton, counts.get(selected) ?? null, t);
    // A municipality the selection sets aside says so after its own figures (spec result-map).
    return aside.has(selected) ? { ...shown, lines: [...shown.lines, t.SET_ASIDE] } : shown;
  });
  // The legend, which names the set-aside municipalities while there are any.
  const legend = $derived(aside.size > 0 ? [...legendOf(t), legendSetAsideOf(t)] : legendOf(t));
  // The shape of the municipality last clicked or tapped, which the map outlines (design of
  // add-small-screens, decision 3).
  const outlined = $derived.by(() => {
    if (clicked === null || sources === null) return null;
    const { number: last } = clicked;
    return sources.map.municipalities.find(([number]) => number === last)?.[1] ?? null;
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
   * While Ctrl or ⌘ is held, which is also how a browser reports a pinch on a trackpad, the wheel
   * over the map zooms around the point under the pointer, a factor of 2 per 300 pixels of the
   * wheel, and the page does not scroll. Without such a key the wheel scrolls the page, as the
   * map stays in the window (spec result-map, "The mouse wheel over the map"; design of
   * redesign-site, decision 15). The listener is not passive, so that it may keep the page from
   * scrolling.
   */
  function wheelZoom(svg: SVGSVGElement): () => void {
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return;
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
  // The pointers pressed on the map, by their id, where each is now: one drags, two pinch, a third
  // is ignored (design of add-small-screens, decision 9). Replaced whole, never changed inside:
  // nothing on the screen follows it, as nothing follows `press`.
  let pressed: ReadonlyMap<number, Point> = new Map();

  /** The pressed pointers with `id` at `point`, or without `id`. */
  function pressedWith(id: number, point: Point | null): ReadonlyMap<number, Point> {
    const others = [...pressed].filter(([other]) => other !== id);
    return new Map(point === null ? others : [...others, [id, point]]);
  }
  // A pinch: the view and both fingers when the second touched.
  let pinch: (Fingers & { view: View }) | null = null;

  /** The two pressed pointers, in pixels from the map's top left corner. */
  function fingersOn(svg: SVGSVGElement): Fingers {
    const box = svg.getBoundingClientRect();
    const points = [...pressed.values()].map((p) => ({ x: p.x - box.left, y: p.y - box.top }));
    if (points.length !== 2) throw new Error('a pinch needs two fingers');
    const [a, b] = points;
    return { a, b };
  }

  function down(event: PointerEvent & { currentTarget: SVGSVGElement }): void {
    if (view === null || event.button !== 0 || pressed.size === 2) return;
    pressed = pressedWith(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pressed.size === 2) {
      // A second finger makes the gesture a pinch at once; like a drag, it selects nothing.
      pinch = { ...fingersOn(event.currentTarget), view };
      press = null;
      selected = null;
      return;
    }
    press = { x: event.clientX, y: event.clientY, view, moved: false };
    // A new press ends the last drag's hold: its own click counts unless it becomes a drag.
    released = null;
  }

  function drag(event: PointerEvent & { currentTarget: SVGSVGElement }): void {
    // A press let go outside the map, before it became a drag, sent no release here.
    if ((event.buttons & 1) === 0) {
      if (pressed.has(event.pointerId)) pressed = pressedWith(event.pointerId, null);
    } else if (pressed.has(event.pointerId)) {
      pressed = pressedWith(event.pointerId, { x: event.clientX, y: event.clientY });
    } else {
      // A pointer pressed that the map does not follow, a third finger or a press begun outside
      // the map, neither moves nor zooms it.
      return;
    }
    if (pinch !== null) {
      if (pressed.size === 2 && sources !== null) {
        const svg = event.currentTarget;
        view = pinchFrom(pinch, fingersOn(svg), svg.getBoundingClientRect().width, sources.map);
      }
      return;
    }
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
    // The release of a pointer the map does not follow, such as a third finger, changes nothing.
    if (!pressed.has(event.pointerId)) return;
    pressed = pressedWith(event.pointerId, null);
    if (pinch !== null) {
      // One of two fingers lifted: the other goes on as a drag from where it is, and the release
      // selects nothing.
      pinch = null;
      press = null;
      if (pressed.size === 1 && view !== null) {
        const [left] = [...pressed.values()];
        press = { ...left, view, moved: true };
      }
      released = { x: event.clientX, y: event.clientY };
      return;
    }
    if (press?.moved === true) released = { x: event.clientX, y: event.clientY };
    press = null;
  }

  function cancel(event: PointerEvent): void {
    if (!pressed.has(event.pointerId)) return;
    pressed = pressedWith(event.pointerId, null);
    pinch = null;
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
    const named = selected === null ? undefined : names.get(selected);
    if (event.type === 'click' && selected !== null && named !== undefined) {
      clicked = { number: selected, name: detailsOf(named.name, named.canton, null, t).name };
    }
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
  <!-- The heading names the map for assistive technology and takes no room (spec result-map, "A
       map on the page of a vote"). -->
  <h2 class="visually-hidden">{t.MAP_HEADING}</h2>
  {#if failed}
    <p>{t.MAP_FAILED}</p>
  {/if}
  {#if sources !== null}
    {@const map = sources.map}
    <!-- The frame knows the map's shape, its width by its height, which the view keeps at every
         zoom: by it the style below caps the frame's width where the map's height is capped. -->
    <div class="frame" style:--shape={map.width / map.height}>
      <div class="picture">
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
        <!-- Pointing, clicking and tapping show a municipality's details (spec result-map); keyboards
             and screen readers read the table of the cantons (design of add-result-map, decision 20). -->
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
          onpointercancel={cancel}
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
              <rect class="hatch-ground" width="1500" height="1500" />
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
          {#if outlined !== null}
            <g class="outlined">
              <path class="halo" d={outlined} />
              <path class="line" d={outlined} />
            </g>
          {/if}
        </svg>
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
    </div>
    <ul class="legend">
      {#each legend as entry (entry.label)}
        <li>
          {#if entry.fill === 'hatch'}
            <span
              class="swatch"
              style:background-image="repeating-linear-gradient(45deg, {HATCH_LINE} 0 2px, var(--ground)
              2px 6px)"
            ></span>
          {:else}
            <span class="swatch" style:background-color={entry.fill}></span>
          {/if}
          {entry.label}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .frame,
  .picture {
    position: relative;
  }
  /* The details of the municipality pointed at, at the map's top left: nothing moves with the
     mouse. */
  .details {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 0.5rem;
    background: color-mix(in srgb, var(--ground) 90%, transparent);
    pointer-events: none;
  }
  .zoom {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: 0.25rem;
  }
  /* On a touch screen each button takes at least 44 × 44 pixels (spec small-screens; design of
     add-small-screens, decision 10). */
  @media (pointer: coarse) {
    .zoom button {
      min-width: 44px;
      min-height: 44px;
    }
  }
  /* Below 640 pixels the zoom buttons stand in a row above the map, aligned to the right, and hide
     none of it (spec small-screens; design of add-small-screens, decision 11). */
  @media (max-width: 639.98px) {
    .frame {
      display: flex;
      flex-direction: column;
    }
    .zoom {
      position: static;
      order: -1;
      justify-content: flex-end;
      margin-bottom: 0.25rem;
    }
    /* The map reaches from one side of the window to the other, past the page's 16 pixels (spec
       result-map, "The result and the map stay in the window"). */
    .picture {
      margin: 0 -16px;
    }
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
  /* Borders keep their width on the screen at every zoom. They, and the ground under the
     hatching, take the page's ground, white or #121212 in the dark scheme (spec result-map, "The
     map in the dark scheme"; design of add-site-style, decision 6). */
  .municipalities path {
    stroke: var(--ground);
    stroke-width: 0.5px;
    vector-effect: non-scaling-stroke;
  }
  .hatch-ground {
    fill: var(--ground);
  }
  /* The municipality last clicked or tapped: black on a white halo, above the cantons' borders,
     at every zoom the same width (spec result-map; design of add-small-screens, decision 4). The
     pointer passes through to the municipality beneath. */
  .outlined path {
    fill: none;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .outlined .halo {
    stroke: #fff;
    stroke-width: 7px;
  }
  .outlined .line {
    stroke: #000;
    stroke-width: 3px;
  }
  .cantons path {
    fill: none;
    stroke: #333;
    stroke-width: 1.5px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  /* The legend stays in the window with the map: it takes no more room than it needs. */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
  }
  .swatch {
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 0.25rem;
    vertical-align: middle;
    border: 1px solid var(--border);
  }
  /* Fingers on the map are the map's: the browser neither scrolls nor zooms the page for them, and
     passes every move on (spec result-map, "Moving the map"; design of add-small-screens,
     decision 8). */
  svg {
    display: block;
    width: 100%;
    height: auto;
    touch-action: none;
  }
  /* Where the result and the map stay in the window, the map is no taller than the window less
     17rem, the room of the result above it and the legend below (design of redesign-site,
     decision 8). It keeps its shape, as its moves count in pixels of a box of the view's shape:
     its frame, with the zoom buttons and the details, is then narrower than its column and
     stands in the column's middle. */
  @media (min-width: 1024px) and (min-height: 700px) {
    .frame {
      max-width: calc((100vh - 17rem) * var(--shape));
      margin: 0 auto;
    }
  }
</style>
