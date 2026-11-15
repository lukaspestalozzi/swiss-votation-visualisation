<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    ALL_VOTES,
    CANTON,
    CANTONAL_VOTES,
    NO_VOTES,
    NOTE_HEADING,
    SIDE,
    TITLE,
    TURNOUT,
    YES_SHARE,
    YES_VOTES,
  } from '../../../lib/texts.ts';
  import type { PageProps } from './$types';
  import ResultMap from './ResultMap.svelte';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.title} – {TITLE}</title>
</svelte:head>

<nav><a href={resolve('/')}>{ALL_VOTES}</a></nav>

<h1>{data.title}</h1>
<p>{data.date} · {data.kind}</p>
{#if data.majoritiesNeeded !== null}
  <p>{data.majoritiesNeeded}</p>
{/if}

{#if data.judged !== null}
  {@const judged = data.judged}
  <dl class="figures">
    <div>
      <dt>{YES_VOTES}</dt>
      <dd>{judged.yesVotes}</dd>
    </div>
    <div>
      <dt>{NO_VOTES}</dt>
      <dd>{judged.noVotes}</dd>
    </div>
    <div>
      <dt>{YES_SHARE}</dt>
      <dd>{judged.yesShare}</dd>
    </div>
    <div>
      <dt>{TURNOUT}</dt>
      <dd>{judged.turnout}</dd>
    </div>
  </dl>

  <div class="verdicts">
    {#each judged.verdicts as verdict (verdict.heading)}
      <section class="verdict">
        <h2>{verdict.heading}</h2>
        <p class="word">{verdict.verdict}</p>
        <p class:greyed={verdict.greyed}>{verdict.figure}</p>
      </section>
    {/each}
  </div>
  <p class="outcome">{judged.outcome}</p>

  {#if data.map !== null}
    <ResultMap figures={data.map} />
  {/if}

  <table>
    <thead>
      <tr>
        <th scope="col">{CANTON}</th>
        <th scope="col">{YES_SHARE}</th>
        <th scope="col">{CANTONAL_VOTES}</th>
        <th scope="col">{SIDE}</th>
      </tr>
    </thead>
    <tbody>
      {#each judged.cantons as row (row.canton)}
        <tr>
          <th scope="row">{row.canton}</th>
          <td>{row.yesShare}</td>
          <td>{row.cantonalVotes}</td>
          <td>{row.side}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

{#if data.tieBreak !== null}
  <section>
    <p>{data.tieBreak.initiative}</p>
    <p>{data.tieBreak.counterProposal}</p>
    <p>{data.tieBreak.cantons}</p>
    <p>{data.tieBreak.notJudged}</p>
  </section>
{/if}

{#each data.differences as difference (difference)}
  <p>{difference}</p>
{/each}
{#if data.source !== null}
  <p>{data.source}</p>
{/if}
{#if data.provisional !== null}
  <p>{data.provisional}</p>
{/if}
{#if data.note !== null}
  <section>
    <h2>{NOTE_HEADING}</h2>
    <p>{data.note}</p>
  </section>
{/if}

<style>
  .figures {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 2rem;
  }
  .figures dd {
    margin: 0;
    font-weight: bold;
  }
  .verdicts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .verdict {
    border: 1px solid;
    padding: 0 1rem;
  }
  .word,
  .outcome {
    font-size: 1.5rem;
    font-weight: bold;
  }
  .greyed {
    /* The lightest grey with WCAG's 4.5:1 on white (4.54:1); GrayText gives only 3.95:1. */
    color: #767676;
  }
  td,
  th {
    padding: 0.125rem 0.75rem 0.125rem 0;
    text-align: left;
  }
</style>
