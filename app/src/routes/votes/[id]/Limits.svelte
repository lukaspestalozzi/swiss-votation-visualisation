<script lang="ts">
  import { resolve } from '$app/paths';
  import { DEFINITIONS, applyingTo, writeUnits } from '../../../lib/characteristics.ts';
  import { STEPS, labelOf, trackOf, valueAt, type LimitSetting } from '../../../lib/limits.ts';
  import {
    ABROAD_SWITCH,
    ADD,
    ADD_LIMIT,
    BACK_TO_REAL,
    CHOOSE,
    GUIDE_LINK,
    LIMITS_FAILED,
    LIMITS_HEADING,
    PANEL_LOADING,
    REMOVE_LIMIT,
    THOUGHT_EXPERIMENT,
    lowerBound,
    removeLimit,
    upperBound,
  } from '../../../lib/texts.ts';
  import type { CharacteristicsFile } from '../../../lib/vote-data.ts';

  // The section with the limits (spec limits): the page holds the limits and the switch, and
  // recalculates from them (design of add-limits, decision 21).
  let {
    file,
    failed,
    voteDate,
    count,
    limits = $bindable(),
    abroadCounted = $bindable(),
  }: {
    file: CharacteristicsFile | null;
    failed: boolean;
    voteDate: string;
    // How many municipalities remain, as the section says it.
    count: string;
    limits: readonly LimitSetting[];
    abroadCounted: boolean;
  } = $props();

  // The characteristics that have no limit yet, in the order of their definitions.
  const offered = $derived(
    DEFINITIONS.filter(
      (definition) => !limits.some((limit) => limit.track.definition === definition),
    ),
  );

  // The characteristic chosen in the list, whose limit "Hinzufügen" adds. The list only chooses:
  // an arrow key changes a closed list's choice at once (Q, 2026-11-16).
  let choice = $state('');

  function add(): void {
    const definition = DEFINITIONS.find((candidate) => candidate.name === choice);
    choice = '';
    if (definition === undefined || file === null) return;
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
  <h2>{LIMITS_HEADING}</h2>
  <p>{THOUGHT_EXPERIMENT} <a href={resolve('/guide')}>{GUIDE_LINK}</a></p>
  {#if failed}
    <p>{LIMITS_FAILED}</p>
  {:else if file === null}
    <p>{PANEL_LOADING}</p>
  {:else}
    <label>
      {ADD_LIMIT}
      <select bind:value={choice}>
        <option value="">{CHOOSE}</option>
        {#each offered as definition (definition.name)}
          <option value={definition.name}>{definition.name}</option>
        {/each}
      </select>
    </label>
    <button type="button" disabled={choice === ''} onclick={add}>{ADD}</button>
    {#each limits as limit, index (limit.track.definition.name)}
      {@const { track, lower, upper } = limit}
      {@const name = track.definition.name}
      <div class="limit">
        <p class="label">{labelOf(track, lower, upper)}</p>
        <div class="track">
          <input
            type="range"
            min="0"
            max={STEPS}
            step="1"
            value={lower}
            style:z-index={lower === STEPS ? 1 : undefined}
            aria-label={lowerBound(name)}
            aria-valuetext={writeUnits(track.definition, valueAt(track, lower))}
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
            aria-label={upperBound(name)}
            aria-valuetext={writeUnits(track.definition, valueAt(track, upper))}
            oninput={(event) => {
              move(index, 'upper', event.currentTarget);
            }}
          />
        </div>
        <button
          type="button"
          aria-label={removeLimit(name)}
          onclick={() => {
            remove(index);
          }}>{REMOVE_LIMIT}</button
        >
      </div>
    {/each}
    <label class="switch">
      <input type="checkbox" bind:checked={abroadCounted} />
      {ABROAD_SWITCH}
    </label>
    <p class="count">{count}</p>
    {#if limits.length > 0 || !abroadCounted}
      <button type="button" onclick={backToReal}>{BACK_TO_REAL}</button>
    {/if}
  {/if}
</section>

<style>
  .limit {
    margin: 0.5rem 0;
  }
  .label {
    margin: 0;
  }
  /* Two sliders laid over one track: the inputs take no pointer, their thumbs do, so that each
     thumb can be dragged (design of add-limits, decision 7). The upper one lies on top, except
     when the lower one has reached the end of the track: both thumbs are there, and only the
     lower one can still move. */
  .track {
    position: relative;
    height: 1.5rem;
    max-width: 30rem;
  }
  .track::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: calc(50% - 2px);
    height: 4px;
    border-radius: 2px;
    background: #999999;
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
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid #ffffff;
    border-radius: 50%;
    background: #333333;
    cursor: pointer;
    pointer-events: auto;
    appearance: none;
  }
  .track input::-moz-range-thumb {
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid #ffffff;
    border-radius: 50%;
    background: #333333;
    cursor: pointer;
    pointer-events: auto;
  }
  .track input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid #1a5fb4;
    outline-offset: 2px;
  }
  .track input:focus-visible::-moz-range-thumb {
    outline: 2px solid #1a5fb4;
    outline-offset: 2px;
  }
</style>
