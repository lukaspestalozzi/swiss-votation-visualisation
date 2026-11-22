<script lang="ts">
  import type { Side } from '../../../lib/vote-page.ts';

  // Each vote's outcome with the selection at the bottom of a narrow window (spec vote-comparison,
  // "The comparison on a phone"; design of add-vote-comparison, decision 7): while a selection
  // applies and a table does not lie wholly within the window. It works as the bar of a vote's
  // page, and repeats the tables, which assistive technology reads in its place.
  let {
    outcomes,
    tables,
  }: {
    // Each chosen vote's outcome with the selection, as "Erste Abstimmung" and "Angenommen";
    // none while no selection applies.
    outcomes: readonly { readonly vote: string; readonly outcome: string; readonly side: Side }[];
    // The tables on the page.
    tables: readonly HTMLElement[];
  } = $props();

  // Whether every table lies wholly within the window; null until the observer has said so for
  // each, so that the bar does not show for the frame before it reports them in view.
  let whole = $state<boolean | null>(null);
  $effect(() => {
    if (tables.length === 0) return;
    // The last the observer said of each table, by its place: it reports only those whose state
    // changed.
    const seen = tables.map((): boolean | null => null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen[tables.indexOf(entry.target as HTMLElement)] = entry.intersectionRatio >= 0.999;
        }
        whole = seen.includes(null) ? null : seen.every(Boolean);
      },
      { threshold: [0.999] },
    );
    for (const table of tables) observer.observe(table);
    return () => {
      observer.disconnect();
      whole = null;
    };
  });

  // Each outcome in the map's colour of its side, as in the tables.
  const sideClass = (side: Side) => (side === null ? undefined : `side-${side}`);
</script>

{#if outcomes.length > 0 && whole === false}
  <div class="comparison-bar" aria-hidden="true">
    {#each outcomes as { vote, outcome, side } (vote)}
      <p>{vote}: <span class={sideClass(side)}>{outcome}</span></p>
    {/each}
  </div>
{/if}

<style>
  /* As the bar of a vote's page: it sticks to the bottom of the window, at the end of the page it
     stands below the last line, and from 640 pixels, the tables side by side, there is none. */
  .comparison-bar {
    position: sticky;
    bottom: 0;
    z-index: 1;
    padding: 0.25rem 0.5rem;
    border-top: 1px solid var(--border);
    background: var(--ground);
  }
  @media (min-width: 640px) {
    .comparison-bar {
      display: none;
    }
  }
  p {
    margin: 0;
    font-weight: bold;
  }
</style>
