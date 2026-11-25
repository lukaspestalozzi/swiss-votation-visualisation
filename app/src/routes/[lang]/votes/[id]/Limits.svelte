<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    DEFINITIONS,
    GROUPS,
    applyingTo,
    writeUnits,
    type Definition,
  } from '../../../../lib/characteristics.ts';
  import {
    BINS,
    STEPS,
    histogramOf,
    labelPartsOf,
    stepOf,
    trackOf,
    valueAt,
    type LimitSetting,
    type Track,
  } from '../../../../lib/limits.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { CharacteristicsFile } from '../../../../lib/vote-data.ts';
  import CharacteristicList from './CharacteristicList.svelte';

  // The section with the limits (spec limits): the page holds the limits and the switch, and
  // recalculates from them (design of add-limits, decision 21).
  let {
    t,
    file,
    failed,
    voteDate,
    count,
    unusable,
    clicked,
    limits = $bindable(),
    abroadCounted = $bindable(),
  }: {
    t: Texts;
    file: CharacteristicsFile | null;
    failed: boolean;
    voteDate: string;
    // How many municipalities remain: the sentence the section says, and their share of those
    // with a result, from 0 to 1, for its bar. None on the comparison, which says it below each
    // vote's result (design of add-vote-comparison, decision 6).
    count: { readonly text: string; readonly share: number } | null;
    // The parts of the page's address it could not use (spec share-link).
    unusable: readonly string[];
    // The municipality last clicked or tapped on the map, which each track marks (spec limits,
    // "The municipality last clicked on a track"); none before a click, and on the comparison.
    clicked: { readonly number: number; readonly name: string } | null;
    limits: readonly LimitSetting[];
    abroadCounted: boolean;
  } = $props();

  // The characteristics that have no limit yet, in the order of their definitions, under the
  // panel's groups; a group with none left is not offered (spec limits, "Adding and removing a
  // limit").
  const offered = $derived(
    GROUPS.map((group) => ({
      group,
      definitions: DEFINITIONS.filter(
        (definition) =>
          definition.group === group &&
          !limits.some((limit) => limit.track.definition === definition),
      ),
    })).filter(({ definitions }) => definitions.length > 0),
  );

  // The bars above a track, as the path of their drawing: 50 side by side, each as tall as its
  // count against the fullest bar's, in hundredths, and one with a municipality at least 2 tall,
  // so that it is seen. Worked out once for a track, when its limit is first drawn (design of
  // redesign-site, decision 21); a step of a slider only moves the clip of the second drawing.
  const drawn = new WeakMap<Track, string>();
  function barsOf(track: Track): string {
    let bars = drawn.get(track);
    if (bars === undefined) {
      const counts = histogramOf(track);
      const fullest = Math.max(...counts);
      bars = counts
        .map((count, bar) => {
          const height = count === 0 ? 0 : Math.max(2, Math.round((count / fullest) * 10000) / 100);
          return `M${String(bar + 0.1)},100v-${String(height)}h0.8v${String(height)}z`;
        })
        .join('');
      drawn.set(track, bars);
    }
    return bars;
  }

  // Where the municipality last clicked stands in the file's list, in whose order a track holds
  // its values; found once for a click, not at every step.
  const clickedAt = $derived(
    clicked === null || file === null ? -1 : file.municipalities.indexOf(clicked.number),
  );

  /**
   * The mark of the municipality last clicked under a track: its place along the track, in
   * hundredths, and its name with its value as the panel writes it. None before a click, and for
   * a municipality without a figure of the track's characteristic.
   */
  function markOf(track: Track): { readonly place: number; readonly text: string } | null {
    const value = clickedAt < 0 ? null : (track.values[clickedAt] ?? null);
    if (clicked === null || value === null) return null;
    return {
      place: stepOf(track, value) / 10,
      text: t.characteristic(clicked.name, writeUnits(track.definition, value, t)),
    };
  }

  /** Add the limit of the characteristic chosen in the list, after those already added. */
  function add(definition: Definition): void {
    if (file === null) return;
    const track = trackOf(definition, file, applyingTo(file, voteDate));
    limits = [...limits, { track, lower: 0, upper: STEPS }];
  }

  /**
   * Move a bound of the limit at `index` to the step its slider shows. A bound moved past the
   * other stops at the other's step (design of add-limits, decision 7).
   */
  function move(index: number, bound: 'lower' | 'upper', slider: HTMLInputElement): void {
    const limit = limits[index];
    let step = Number(slider.value);
    if (bound === 'lower' && step > limit.upper) step = limit.upper;
    if (bound === 'upper' && step < limit.lower) step = limit.lower;
    slider.value = String(step);
    limits = limits.map((other, i) => (i === index ? { ...other, [bound]: step } : other));
  }

  function remove(index: number): void {
    limits = limits.filter((_, i) => i !== index);
  }

  /** Back to the real result: no limit, and the Swiss abroad counted (spec limits). */
  function backToReal(): void {
    limits = [];
    abroadCounted = true;
  }
</script>

<section class="limits">
  <h2>{t.LIMITS_HEADING}</h2>
  <p class="intro">
    {t.THOUGHT_EXPERIMENT}
    <a href={resolve('/[lang]/guide', { lang: t.LANGUAGE })}>{t.GUIDE_LINK}</a>
  </p>
  {#if unusable.length > 0}
    <p>{t.unusableParts(unusable)}</p>
  {/if}
  {#if failed}
    <p>{t.LIMITS_FAILED}</p>
  {:else if file === null}
    <p>{t.PANEL_LOADING}</p>
  {:else}
    {#if count !== null}
      <p class="count">{count.text}</p>
      <div class="count-bar" aria-hidden="true">
        <span style:width="{count.share * 100}%"></span>
      </div>
    {/if}
    {#if limits.length > 0}
      <ul class="added">
        {#each limits as limit, index (limit.track.definition.key)}
          {@const { track, lower, upper } = limit}
          {@const label = labelPartsOf(track, lower, upper, t)}
          {@const bars = barsOf(track)}
          {@const mark = markOf(track)}
          <li class="limit">
            <div class="limit-head">
              <!-- The label is one text, "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", in
                   three parts; the colon is read, and not seen before the line of the bounds. -->
              <p class="label">
                <span class="name">{label.name}</span>
                <span class="date">{label.date}</span><span class="visually-hidden">:</span>
                <span class="bounds">{label.bounds}</span>
              </p>
              <button
                type="button"
                class="remove"
                aria-label={t.removeLimit(label.name)}
                onclick={() => {
                  remove(index);
                }}>{t.REMOVE_LIMIT}</button
              >
            </div>
            <!-- Where the municipalities lie on the track: the bars drawn twice, grey and in the
                 text's colour, the second clipped to the part between the two bounds. -->
            <div class="hist" aria-hidden="true">
              <svg class="out" viewBox="0 0 {BINS} 100" preserveAspectRatio="none">
                <path d={bars} />
              </svg>
              <svg
                class="in"
                viewBox="0 0 {BINS} 100"
                preserveAspectRatio="none"
                style:clip-path="inset(0 {(STEPS - upper) / 10}% 0 {lower / 10}%)"
              >
                <path d={bars} />
              </svg>
            </div>
            <div class="track">
              <span class="way">
                <span class="range" style:left="{lower / 10}%" style:right="{(STEPS - upper) / 10}%"
                ></span>
              </span>
              <input
                type="range"
                min="0"
                max={STEPS}
                step="1"
                value={lower}
                style:z-index={lower === STEPS ? 1 : undefined}
                aria-label={t.lowerBound(label.name)}
                aria-valuetext={writeUnits(track.definition, valueAt(track, lower), t)}
                oninput={(event) => {
                  move(index, 'lower', event.currentTarget);
                }}
              />
              <input
                type="range"
                min="0"
                max={STEPS}
                step="1"
                value={upper}
                aria-label={t.upperBound(label.name)}
                aria-valuetext={writeUnits(track.definition, valueAt(track, upper), t)}
                oninput={(event) => {
                  move(index, 'upper', event.currentTarget);
                }}
              />
            </div>
            {#if mark !== null}
              <!-- The municipality last clicked: a mark at its step, and its name and value,
                   which begin at the mark at the track's start, end at it at the track's end,
                   and so never reach past the track. -->
              <p class="here">
                <span class="mark" style:left="{mark.place}%"></span>
                <span
                  class="at"
                  style:left="{mark.place}%"
                  style:transform="translateX(-{mark.place}%)">{mark.text}</span
                >
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <CharacteristicList {t} {offered} onchoose={add} />
    <!-- The switch is a checkbox, drawn as a switch: the box lies over the drawing, unseen. -->
    <label class="switch">
      <span class="box">
        <input type="checkbox" bind:checked={abroadCounted} />
        <span class="knob"></span>
      </span>
      <span>{t.ABROAD_SWITCH}</span>
    </label>
    {#if limits.length > 0 || !abroadCounted}
      <button type="button" class="back" onclick={backToReal}>{t.BACK_TO_REAL}</button>
    {/if}
  {/if}
</section>

<style>
  /* The section begins at its column's top, level with the result beside it (spec limits, "The
     limits on a vote's page"). */
  h2 {
    margin: 0 0 0.5rem;
  }
  .intro {
    margin-top: 0;
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }
  /* The number of municipalities that remain, and a bar filled to their share (spec limits, "The
     number of municipalities that remain"). */
  .count {
    margin: 1.25rem 0 0.25rem;
    font-variant-numeric: tabular-nums;
  }
  .count-bar {
    max-width: 30rem;
    height: 0.25rem;
    background: var(--track);
  }
  .count-bar span {
    display: block;
    height: 100%;
    background: var(--text);
  }
  /* The limits added, a line between them. The width of a thumb is named once: half of it lies
     at each end of a track beyond the way of the thumb's middle, along which the bars and the
     range between the bounds are drawn. */
  .added {
    --thumb: 1.1rem;
    max-width: 30rem;
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;
    border-bottom: 1px solid var(--hairline);
  }
  .limit {
    padding: 1rem 0 1.125rem;
    border-top: 1px solid var(--hairline);
  }
  .limit-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .label {
    margin: 0;
  }
  .name {
    font-weight: 700;
  }
  .date {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .bounds {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
  /* "Entfernen" is a quiet button: underlined text. */
  .remove {
    flex: none;
    padding: 0;
    border: 0;
    background: none;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
  }
  /* The bars above the track (spec limits, "Where the municipalities lie on a track"): those
     outside the bounds grey, those between them in the text's colour. */
  .hist {
    position: relative;
    height: 2.5rem;
    margin: 0.5rem calc(var(--thumb) / 2) 0;
  }
  .hist svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .out path {
    fill: var(--bins-outside);
  }
  .in path {
    fill: var(--text);
  }
  /* Two sliders laid over one track: the inputs take no pointer, their thumbs do, so that each
     thumb can be dragged (design of add-limits, decision 7). The upper one lies on top, except
     when the lower one has reached the end of the track: both thumbs are there, and only the
     lower one can still move. */
  .track {
    position: relative;
    height: 1.5rem;
  }
  .track::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: calc(50% - 1px);
    height: 2px;
    background: var(--border);
  }
  /* The way of a thumb's middle, and on it the range between the two bounds. */
  .way {
    position: absolute;
    left: calc(var(--thumb) / 2);
    right: calc(var(--thumb) / 2);
    top: calc(50% - 2px);
    height: 4px;
  }
  .range {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--text);
  }
  .track input {
    position: absolute;
    inset: 0;
    width: 100%;
    margin: 0;
    background: none;
    pointer-events: none;
    appearance: none;
  }
  .track input::-webkit-slider-thumb {
    width: var(--thumb);
    height: var(--thumb);
    border: 2px solid var(--ground);
    border-radius: 50%;
    background: var(--text);
    cursor: pointer;
    pointer-events: auto;
    appearance: none;
  }
  .track input::-moz-range-thumb {
    width: var(--thumb);
    height: var(--thumb);
    border: 2px solid var(--ground);
    border-radius: 50%;
    background: var(--text);
    cursor: pointer;
    pointer-events: auto;
  }
  .track input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }
  .track input:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }
  /* The mark of the municipality last clicked, below the track, along the way of a thumb's
     middle (spec limits, "The municipality last clicked on a track"). */
  .here {
    position: relative;
    height: 1.5rem;
    margin: 0.125rem calc(var(--thumb) / 2) 0;
    font-size: 0.8125rem;
  }
  .mark {
    position: absolute;
    top: 0;
    margin-left: -4px;
    border: 4px solid transparent;
    border-top: 0;
    border-bottom: 6px solid var(--text);
  }
  .at {
    position: absolute;
    top: 0.375rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The switch (design of redesign-site, decision 20): the checkbox lies over its drawing and is
     not seen; on, the drawing is filled with the text's colour, its dot at the right. */
  .switch {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: start;
    margin-top: 1.25rem;
    cursor: pointer;
  }
  .box {
    position: relative;
    display: block;
    margin-top: 0.125rem;
  }
  .box input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .knob {
    display: block;
    box-sizing: border-box;
    width: 2.5rem;
    height: 1.5rem;
    padding: 2px;
    border: 2px solid var(--text);
    border-radius: 999px;
    background: var(--ground);
  }
  .knob::after {
    content: '';
    display: block;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--text);
  }
  .box input:checked + .knob {
    background: var(--text);
  }
  .box input:checked + .knob::after {
    margin-left: 1rem;
    background: var(--ground);
  }
  .box input:focus-visible + .knob {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }
  .back {
    margin-top: 1.25rem;
  }
  /* On a touch screen the buttons and the switch take at least 44 × 44 pixels; the switch by
     its label, whose text toggles it too (spec small-screens; design of add-small-screens,
     decision 10). */
  @media (pointer: coarse) {
    button {
      min-width: 44px;
      min-height: 44px;
    }
    .switch {
      min-height: 44px;
    }
    /* Each thumb takes a 44-pixel square whose border is transparent, so that the dot a visitor
       sees keeps its size, its white ring drawn inside; the track is as tall. */
    .added {
      --thumb: 44px;
    }
    .track {
      height: 44px;
    }
    .track input::-webkit-slider-thumb {
      border: 13px solid transparent;
      background-clip: padding-box;
      box-shadow: inset 0 0 0 2px var(--ground);
    }
    .track input::-moz-range-thumb {
      border: 13px solid transparent;
      background-clip: padding-box;
      box-shadow: inset 0 0 0 2px var(--ground);
    }
    .track input:focus-visible::-webkit-slider-thumb {
      outline-offset: -11px;
    }
    .track input:focus-visible::-moz-range-thumb {
      outline-offset: -11px;
    }
  }
</style>
