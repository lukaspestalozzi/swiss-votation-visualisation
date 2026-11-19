<script lang="ts">
  import { resolve } from '$app/paths';
  import { DEFINITIONS, applyingTo, nameOf, writeUnits } from '../../../../lib/characteristics.ts';
  import { STEPS, labelOf, trackOf, valueAt, type LimitSetting } from '../../../../lib/limits.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { CharacteristicsFile } from '../../../../lib/vote-data.ts';

  // The section with the limits (spec limits): the page holds the limits and the switch, and
  // recalculates from them (design of add-limits, decision 21).
  let {
    t,
    file,
    failed,
    voteDate,
    count,
    limits = $bindable(),
    abroadCounted = $bindable(),
  }: {
    t: Texts;
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
    const definition = DEFINITIONS.find((candidate) => nameOf(candidate, t) === choice);
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
  <h2>{t.LIMITS_HEADING}</h2>
  <p>
    {t.THOUGHT_EXPERIMENT}
    <a href={resolve('/[lang]/guide', { lang: t.LANGUAGE })}>{t.GUIDE_LINK}</a>
  </p>
  {#if failed}
    <p>{t.LIMITS_FAILED}</p>
  {:else if file === null}
    <p>{t.PANEL_LOADING}</p>
  {:else}
    <label>
      {t.ADD_LIMIT}
      <select bind:value={choice}>
        <option value="">{t.CHOOSE}</option>
        {#each offered as definition (definition.key)}
          <option value={nameOf(definition, t)}>{nameOf(definition, t)}</option>
        {/each}
      </select>
    </label>
    <button type="button" disabled={choice === ''} onclick={add}>{t.ADD}</button>
    {#each limits as limit, index (limit.track.definition.key)}
      {@const { track, lower, upper } = limit}
      {@const name = nameOf(track.definition, t)}
      <div class="limit">
        <p class="label">{labelOf(track, lower, upper, t)}</p>
        <div class="track">
          <input
            type="range"
            min="0"
            max={STEPS}
            step="1"
            value={lower}
            style:z-index={lower === STEPS ? 1 : undefined}
            aria-label={t.lowerBound(name)}
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
            aria-label={t.upperBound(name)}
            aria-valuetext={writeUnits(track.definition, valueAt(track, upper), t)}
            oninput={(event) => {
              move(index, 'upper', event.currentTarget);
            }}
          />
        </div>
        <button
          type="button"
          aria-label={t.removeLimit(name)}
          onclick={() => {
            remove(index);
          }}>{t.REMOVE_LIMIT}</button
        >
      </div>
    {/each}
    <label class="switch">
      <input type="checkbox" bind:checked={abroadCounted} />
      {t.ABROAD_SWITCH}
    </label>
    <p class="count">{count}</p>
    {#if limits.length > 0 || !abroadCounted}
      <button type="button" onclick={backToReal}>{t.BACK_TO_REAL}</button>
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
    background: var(--border);
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
    border: 2px solid var(--ground);
    border-radius: 50%;
    background: var(--text);
    cursor: pointer;
    pointer-events: auto;
    appearance: none;
  }
  .track input::-moz-range-thumb {
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid var(--ground);
    border-radius: 50%;
    background: var(--text);
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
  /* On a touch screen the list, the buttons and the switch take at least 44 × 44 pixels; the
     switch by its label, whose text toggles it too (spec small-screens; design of
     add-small-screens, decision 10). */
  @media (pointer: coarse) {
    select,
    button {
      min-width: 44px;
      min-height: 44px;
    }
    .switch {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-height: 44px;
    }
    .switch input {
      flex: none;
      width: 24px;
      height: 24px;
      margin: 0;
    }
    /* Each thumb takes a 44-pixel square whose border is transparent, so that the dot a visitor
       sees keeps its size, its white ring drawn inside; the track is as tall. */
    .track {
      height: 44px;
    }
    .track input::-webkit-slider-thumb {
      width: 44px;
      height: 44px;
      border: 13px solid transparent;
      background-clip: padding-box;
      box-shadow: inset 0 0 0 2px var(--ground);
    }
    .track input::-moz-range-thumb {
      width: 44px;
      height: 44px;
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
