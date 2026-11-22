<script lang="ts">
  import type { Comparable, VoteTable } from '../../../lib/comparison.ts';
  import type { Texts } from '../../../lib/texts/index.ts';

  // A chosen vote of the comparison (spec vote-comparison, "The table of a vote"; design of
  // add-vote-comparison, decision 6): its title, date and kind, its table, its count and its
  // notes; while its file loads, or when it cannot be loaded, a sentence in the table's place.
  let {
    t,
    vote,
    table,
    element = $bindable(),
  }: {
    t: Texts;
    vote: Comparable;
    table: VoteTable | 'loading' | 'failed';
    // The table, while it is on the page, which the bar at the bottom of a narrow window observes.
    // No fallback: Svelte binds no undefined to a prop that has one, and the page has no table of
    // a vote before it shows.
    element?: HTMLElement | null;
  } = $props();
</script>

<section class="vote" data-vote={vote.id}>
  <h2>{vote.title}</h2>
  <p class="secondary">{vote.dateAndKind}</p>
  {#if table === 'loading'}
    <p>{t.VOTE_LOADING}</p>
  {:else if table === 'failed'}
    <p>{t.VOTE_FAILED}</p>
  {:else}
    <table bind:this={element}>
      <thead>
        <tr>
          <td></td>
          {#each table.columns as column (column)}
            <th scope="col">{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row (row.heading)}
          <tr>
            <th scope="row">{row.heading}</th>
            {#each row.cells as cell, index (index)}
              <td>
                <span class:side-yes={cell.side === 'yes'} class:side-no={cell.side === 'no'}
                  >{cell.word}</span
                >
                {#if cell.figure !== null}
                  <span class:greyed={cell.greyed}>{cell.figure}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if table.count !== null}
      <p class="count">{table.count}</p>
    {/if}
  {/if}
  {#each vote.notes as note (note)}
    <p class="secondary">{note}</p>
  {/each}
</section>

<style>
  /* A word too long for its line breaks within it, as a vote page's heading does. */
  h2 {
    overflow-wrap: anywhere;
  }
  th[scope='row'] {
    text-align: left;
    padding-right: 1rem;
  }
  .greyed {
    /* As on the vote's page: the lightest grey with 4.5:1 on the page's ground. */
    color: var(--greyed);
  }
</style>
