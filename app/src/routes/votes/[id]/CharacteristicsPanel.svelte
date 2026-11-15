<script lang="ts">
  import { applyingTo, countsOf, panelOf } from '../../../lib/characteristics.ts';
  import {
    CHARACTERISTICS_SOURCES,
    PANEL_FAILED,
    PANEL_HEADING,
    PANEL_LOADING,
    PANEL_PROMPT,
  } from '../../../lib/texts.ts';
  import type { CharacteristicsFile } from '../../../lib/vote-data.ts';

  // The characteristics of the municipality last pointed at, clicked or tapped (spec result-map):
  // `file` is null while it loads; `name` is the municipality's name as its details write it.
  let {
    file,
    failed,
    number,
    name,
    voteDate,
  }: {
    file: CharacteristicsFile | null;
    failed: boolean;
    number: number | null;
    name: string | null;
    voteDate: string;
  } = $props();

  const applying = $derived(file === null ? null : applyingTo(file, voteDate));
  const groups = $derived(
    file === null || applying === null || number === null
      ? null
      : panelOf(countsOf(file, applying, number), applying),
  );
</script>

<section class="panel" aria-labelledby="characteristics-heading">
  <h3 id="characteristics-heading">{PANEL_HEADING}</h3>
  {#if failed}
    <p>{PANEL_FAILED}</p>
  {:else if file === null}
    <p>{PANEL_LOADING}</p>
  {:else if groups === null || name === null}
    <p>{PANEL_PROMPT}</p>
  {:else}
    <p class="name">{name}</p>
    {#each groups as group (group.heading)}
      <h4>{group.heading}</h4>
      <ul>
        {#each group.lines as line (line)}
          <li>{line}</li>
        {/each}
      </ul>
    {/each}
    <p class="source">{CHARACTERISTICS_SOURCES}</p>
  {/if}
</section>

<style>
  .panel h3 {
    margin-top: 0;
  }
  .panel h4 {
    margin: 0.75rem 0 0.25rem;
  }
  .panel ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .name {
    font-weight: bold;
  }
</style>
