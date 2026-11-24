<script lang="ts">
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { ResultShown } from '../../../../lib/vote-page.ts';
  import ShareBar from '../../ShareBar.svelte';

  // A result as a row (spec verdicts, "The two verdicts side by side" and "The bars of a result";
  // design of redesign-site, decisions 10 to 13): its heading and outcome, the majority of voters
  // with its bar and the votes below it, and the majority of cantons with a bar of one segment
  // per canton. A majority that is not needed has no bar. A bar draws what the figures beside it
  // say, so assistive technology passes it over.
  let {
    t,
    heading,
    result,
    turnout = null,
    selection = false,
    element = $bindable(null),
  }: {
    t: Texts;
    // "Echtes Ergebnis" or "Mit Ihrer Auswahl".
    heading: string;
    result: ResultShown;
    // The vote's turnout; the result of a selection has none.
    turnout?: string | null;
    // Whether this is the result of a selection, which stands below the vote's.
    selection?: boolean;
    // The row's element, which the bar of a narrow window watches (spec small-screens).
    element?: HTMLElement | null;
  } = $props();

  const voters = $derived(result.verdicts[0]);
  const cantons = $derived(result.verdicts[1]);
</script>

<section class="result" class:selection bind:this={element}>
  <div>
    <h2>{heading}</h2>
    <p
      class="outcome"
      class:side-yes={result.outcomeSide === 'yes'}
      class:side-no={result.outcomeSide === 'no'}
    >
      {result.outcome}
    </p>
  </div>

  <section class="verdict">
    <div class="head">
      <h3>{voters.heading}</h3>
      <p class="word" class:side-yes={voters.side === 'yes'} class:side-no={voters.side === 'no'}>
        {voters.verdict}
      </p>
      <p class="figure">{voters.figure}</p>
    </div>
    <ShareBar percent={result.yesPercent} />
    <dl class="figures">
      <div>
        <dt>{t.YES_VOTES}</dt>
        <dd>{result.yesVotes}</dd>
      </div>
      <div>
        <dt>{t.NO_VOTES}</dt>
        <dd>{result.noVotes}</dd>
      </div>
    </dl>
  </section>

  <section class="verdict">
    <div class="head">
      <h3>{cantons.heading}</h3>
      <p
        class="word"
        class:side-yes={cantons.side === 'yes'}
        class:side-no={cantons.side === 'no'}
        class:plain={cantons.greyed}
      >
        {cantons.verdict}
      </p>
      <p class="figure" class:greyed={cantons.greyed}>{cantons.figure}</p>
    </div>
    {#if !cantons.greyed}
      <!-- A segment per canton, as wide as its cantonal votes; its name shows on pointing. -->
      <div class="bar cantons" aria-hidden="true">
        {#each result.segments as segment (segment.canton)}
          <span class={segment.side} style:flex-grow={segment.weight} title={segment.canton}></span>
        {/each}
        <span class="half"></span>
      </div>
    {/if}
    {#if turnout !== null}
      <dl class="figures">
        <div>
          <dt>{t.TURNOUT}</dt>
          <dd>{turnout}</dd>
        </div>
      </dl>
    {/if}
  </section>
</section>

<style>
  /* The outcome, the majority of voters and the majority of cantons in one row. Every result of
     a page has these columns, so that the bars of two results lie one above the other. */
  .result {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.5rem 2.5rem;
    align-items: start;
  }
  /* A result follows the room it has, not the window (design of redesign-site, decision 10): with
     less than 640 pixels its outcome stands above the two majorities, with less than 448 all
     three stand one below the other. The room is that of the element that holds a page's
     results, which names itself a container. */
  @container (max-width: 639.98px) {
    .result {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.75rem 2rem;
    }
    .result > :first-child {
      grid-column: 1 / -1;
    }
  }
  @container (max-width: 447.98px) {
    .result {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .selection {
    margin-top: 0.875rem;
    padding-top: 0.875rem;
    border-top: 1px solid var(--hairline);
  }
  h2 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--text-secondary);
  }
  .outcome {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }
  /* A majority's name, its word and, at the right, its figure. A word too long for its line
     breaks (spec small-screens). */
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 0.5rem;
    font-size: 0.9375rem;
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  .head h3,
  .head p {
    margin: 0;
    font-size: inherit;
    line-height: 1.5;
    font-weight: 600;
  }
  .head .figure {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }
  .head .plain,
  .head .greyed {
    font-weight: 400;
  }
  .greyed {
    /* The lightest grey with WCAG's 4.5:1 on white (4.54:1); GrayText gives only 3.95:1. */
    color: var(--greyed);
  }
  /* The cantons' bar, a bar of `app.css`: a line of the ground between two cantons, and the gap
     of two pixels between those in favour and those against. */
  .cantons .yes,
  .cantons .no {
    flex: 0 0 0;
    box-shadow: inset -1px 0 0 var(--ground);
  }
  .cantons .yes + .no {
    box-shadow:
      inset 1px 0 0 var(--ground),
      inset -1px 0 0 var(--ground);
  }
  .figures {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 1rem;
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
  .figures div {
    display: flex;
    gap: 0.375rem;
  }
  .figures dd {
    margin: 0;
  }
</style>
