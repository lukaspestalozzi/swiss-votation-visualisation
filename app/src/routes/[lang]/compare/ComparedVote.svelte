<script lang="ts">
  import type { Comparable, VoteResults } from '../../../lib/comparison.ts';
  import type { Texts } from '../../../lib/texts/index.ts';
  import ResultRow from '../votes/[id]/ResultRow.svelte';
  import VoteSummary from '../votes/[id]/VoteSummary.svelte';

  // A chosen vote of the comparison (spec vote-comparison, "The results of a vote"; design of
  // redesign-site, decision 26): its title, date and kind, its results as its page draws them,
  // the selection's below the real one, its count and its notes; while its file loads, or when
  // it cannot be loaded, a sentence in the results' place.
  let {
    t,
    vote,
    results,
    element = $bindable(),
  }: {
    t: Texts;
    vote: Comparable;
    results: VoteResults | 'loading' | 'failed';
    // The results, while they are on the page, which the bar at the bottom of a narrow window
    // observes. No fallback: Svelte binds no undefined to a prop that has one, and the page has
    // no results of a vote before they show.
    element?: HTMLElement | null;
  } = $props();
</script>

<section class="vote" data-vote={vote.id}>
  <h2>{vote.title}</h2>
  <p class="secondary">{vote.dateAndKind}</p>
  <div class="summary"><VoteSummary summary={vote.summary} /></div>
  {#if results === 'loading'}
    <p>{t.VOTE_LOADING}</p>
  {:else if results === 'failed'}
    <p>{t.VOTE_FAILED}</p>
  {:else}
    <div class="results" bind:this={element}>
      {#each results.rows as row (row.selection)}
        <ResultRow
          {t}
          heading={row.heading}
          result={row.result}
          turnout={row.turnout}
          selection={row.selection}
          level={3}
        />
      {/each}
    </div>
    {#if results.count !== null}
      <p class="count">{results.count}</p>
    {/if}
  {/if}
  {#each vote.notes as note (note)}
    <p class="secondary">{note}</p>
  {/each}
</section>

<style>
  /* A word too long for its line breaks within it, as a vote page's heading does. */
  h2 {
    margin: 0;
    font-size: 1.375rem;
    overflow-wrap: anywhere;
  }
  h2 + p {
    margin: 0.25rem 0 1rem;
  }
  /* The results are as wide as the room they have, by which a result arranges its parts
     (`ResultRow.svelte`). */
  .results {
    container-type: inline-size;
  }
  .count {
    margin: 0.875rem 0 0;
  }
  .summary {
    margin-bottom: 1rem;
  }
</style>
