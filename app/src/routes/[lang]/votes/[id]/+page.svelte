<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { textsOf } from '../../../../lib/texts/index.ts';
  import { calculateResult, entriesThatRemain } from 'calculation';
  import { onMount } from 'svelte';
  import {
    isNarrowed,
    remainingOf,
    remainingUnder,
    setAsideOf,
    trackOf,
    type LimitSetting,
  } from '../../../../lib/limits.ts';
  import { formatCount } from '../../../../lib/format.ts';
  import { applyingTo } from '../../../../lib/characteristics.ts';
  import { linkOf, selectionOf } from '../../../../lib/share-link.ts';
  import { judgedOf } from '../../../../lib/vote-page.ts';
  import type { CharacteristicsFile } from '../../../../lib/vote-data.ts';
  import type { PageProps } from './$types';
  import Limits from './Limits.svelte';
  import { loadCharacteristics } from './loaders.ts';
  import ResultMap from './ResultMap.svelte';
  import SelectionBar from './SelectionBar.svelte';

  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));

  // The selection (spec limits): the limits and the switch for the Swiss abroad, for this page
  // only (design of add-limits, decision 18). The characteristics are those the panel loads.
  let limits = $state.raw<readonly LimitSetting[]>([]);
  let abroadCounted = $state(true);
  let characteristics = $state.raw<CharacteristicsFile | null>(null);
  let characteristicsFailed = $state(false);
  // How often the page has read the selection its address holds: it writes the address only once
  // it has read it, and anew after every reading, so that the address takes the selection as the
  // page writes it (design of add-share-link, decisions 5 and 6). A tie-break question's page,
  // without limits, does neither (decision 7).
  let readings = $state(0);
  onMount(() => {
    loadCharacteristics().then(
      (loaded) => {
        characteristics = loaded;
        if (data.entries === null) return;
        readAddress(loaded);
      },
      () => {
        characteristicsFailed = true;
      },
    );
  });

  // The selection in the page's address (spec share-link): the link the selection gives, written
  // into the address once the selection has stayed the same for half a second, once the page has
  // read its address (design of add-share-link, decisions 5 and 6).
  const link = $derived(linkOf(limits, abroadCounted));
  $effect(() => {
    if (readings === 0) return;
    const hash = link === '' ? '' : `#${link}`;
    const timer = setTimeout(() => {
      // Compared with the browser's address and with the address as SvelteKit knows it, which the
      // language switch carries: a link opened in this tab changes the browser's but not
      // SvelteKit's, so the page writes it once more after reading it (Q, 2026-11-20).
      if (hash === location.hash && hash === (page.shallow?.url ?? page.url).hash) return;
      // The page's own path as the browser shows it, the site's path and the final slash
      // included, with only its hash changed (Q, 2026-11-19): `resolve` gives the path without
      // the final slash, and the rule accepts no address built from it.
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- the page's own path
      void goto(`${page.url.pathname}${hash}`, { shallow: true, replace: true });
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  });

  // The parts of the address the page could not use, which the limits name until the visitor
  // next changes the selection: until its link differs from the one read (design of
  // add-share-link, decision 4).
  let unusable = $state.raw<readonly string[]>([]);
  let readLink = '';
  $effect(() => {
    if (link !== readLink) unusable = [];
  });

  /**
   * Take the selection the page's address holds (spec share-link, "Opening a link"), on the
   * tracks of the characteristics that apply to the vote.
   */
  function readAddress(file: CharacteristicsFile): void {
    const applying = applyingTo(file, data.voteDate);
    const read = selectionOf(location.hash.slice(1), (definition) =>
      trackOf(definition, file, applying),
    );
    limits = read.limits;
    abroadCounted = read.abroadCounted;
    readLink = linkOf(read.limits, read.abroadCounted);
    unusable = read.unusable;
    readings += 1;
  }

  // The municipalities that remain under the limits, once the characteristics are loaded.
  const remaining = $derived(
    characteristics === null ? null : remainingUnder(characteristics.municipalities, limits),
  );
  // A selection applies while a limit is narrowed or the Swiss abroad are not counted (spec
  // verdicts, "The result of the selection").
  const applies = $derived(!abroadCounted || limits.some(isNarrowed));
  // The selection's result, as the page writes it, while a selection applies.
  const selection = $derived.by(() => {
    const { entries, majorities } = data;
    if (!applies || remaining === null || entries === null || majorities === 'not-calculated') {
      return null;
    }
    const kept = entriesThatRemain(entries.cantons, remaining, abroadCounted);
    const cantons = entries.cantons
      .filter((canton) => canton.municipalities.length > 0 || canton.abroad !== null)
      .map((canton) => canton.canton);
    return judgedOf(calculateResult(kept, majorities), majorities, cantons, t);
  });
  // The numbers of the municipalities with an entry, flattened once, not at every step.
  const withEntry = $derived(
    data.entries === null
      ? []
      : data.entries.cantons.flatMap((canton) => canton.municipalities.map(([number]) => number)),
  );
  // How many of the municipalities with an entry remain (spec limits, "The number of
  // municipalities that remain").
  const count = $derived.by(() => {
    if (remaining === null || data.entries === null) return '';
    const left = remainingOf(withEntry, remaining);
    return left === 0
      ? t.NOTHING_REMAINS
      : t.remainingCount(formatCount(left), formatCount(withEntry.length));
  });
  // The box "Mit Ihrer Auswahl", which the bar at the bottom of a narrow window repeats while it is
  // not wholly on the screen (spec small-screens).
  let selectionBox = $state<HTMLElement | null>(null);
  // The municipalities with an entry that the selection sets aside, dark grey on the map.
  const aside = $derived.by((): ReadonlySet<number> => {
    if (remaining === null || data.entries === null) return new Set();
    return setAsideOf(withEntry, remaining);
  });
</script>

<svelte:head>
  <title>{data.title} – {t.TITLE}</title>
</svelte:head>

<!-- A link to this vote opened in its tab changes only the hash (spec share-link, "A link in the
     same tab"); before the characteristics have loaded, the page reads the address it then has. -->
<svelte:window
  onhashchange={() => {
    if (readings > 0 && characteristics !== null) readAddress(characteristics);
  }}
/>

<nav><a href={resolve('/[lang]', { lang: data.lang })}>{t.ALL_VOTES}</a></nav>

<h1>{data.title}</h1>
<p class="secondary">{data.date} · {data.kind}</p>
{#if data.majoritiesNeeded !== null}
  <p>{data.majoritiesNeeded}</p>
{/if}

{#if data.judged !== null}
  {@const judged = data.judged}
  <div class="results">
    <div class="result">
      <dl class="figures">
        <div>
          <dt>{t.YES_VOTES}</dt>
          <dd>{judged.yesVotes}</dd>
        </div>
        <div>
          <dt>{t.NO_VOTES}</dt>
          <dd>{judged.noVotes}</dd>
        </div>
        <div>
          <dt>{t.YES_SHARE}</dt>
          <dd>{judged.yesShare}</dd>
        </div>
        <div>
          <dt>{t.TURNOUT}</dt>
          <dd>{judged.turnout}</dd>
        </div>
      </dl>

      <div class="verdicts">
        {#each judged.verdicts as verdict (verdict.heading)}
          <section class="verdict">
            <h2>{verdict.heading}</h2>
            <p
              class="word"
              class:side-yes={verdict.side === 'yes'}
              class:side-no={verdict.side === 'no'}
            >
              {verdict.verdict}
            </p>
            <p class:greyed={verdict.greyed}>{verdict.figure}</p>
          </section>
        {/each}
      </div>
      <p
        class="outcome"
        class:side-yes={judged.outcomeSide === 'yes'}
        class:side-no={judged.outcomeSide === 'no'}
      >
        {judged.outcome}
      </p>
    </div>
    {#if selection !== null}
      <section class="result selection" bind:this={selectionBox}>
        <h2>{t.WITH_SELECTION}</h2>
        <dl class="figures">
          <div>
            <dt>{t.YES_VOTES}</dt>
            <dd>{selection.yesVotes}</dd>
          </div>
          <div>
            <dt>{t.NO_VOTES}</dt>
            <dd>{selection.noVotes}</dd>
          </div>
          <div>
            <dt>{t.YES_SHARE}</dt>
            <dd>{selection.yesShare}</dd>
          </div>
        </dl>
        <div class="verdicts">
          {#each selection.verdicts as verdict (verdict.heading)}
            <section class="verdict">
              <h3>{verdict.heading}</h3>
              <p
                class="word"
                class:side-yes={verdict.side === 'yes'}
                class:side-no={verdict.side === 'no'}
              >
                {verdict.verdict}
              </p>
              <p class:greyed={verdict.greyed}>{verdict.figure}</p>
            </section>
          {/each}
        </div>
        <p
          class="outcome"
          class:side-yes={selection.outcomeSide === 'yes'}
          class:side-no={selection.outcomeSide === 'no'}
        >
          {selection.outcome}
        </p>
      </section>
    {/if}
  </div>

  {#if data.entries !== null}
    <Limits
      {t}
      file={characteristics}
      failed={characteristicsFailed}
      voteDate={data.voteDate}
      {count}
      {unusable}
      bind:limits
      bind:abroadCounted
    />
    <ResultMap {t} entries={data.entries} {aside} title={data.title} voteDate={data.voteDate} />
  {/if}

  <table>
    {#if selection !== null}
      <caption>{t.WITH_SELECTION}</caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{t.CANTON}</th>
        <th scope="col">{t.YES_SHARE}</th>
        <th scope="col">{t.CANTONAL_VOTES}</th>
        <th scope="col">{t.SIDE}</th>
      </tr>
    </thead>
    <tbody>
      {#each (selection ?? judged).cantons as row (row.canton)}
        <tr>
          <th scope="row">{row.canton}</th>
          <td>{row.yesShare}</td>
          <td>{row.cantonalVotes}</td>
          <td class:side-yes={row.forSide === 'yes'} class:side-no={row.forSide === 'no'}>
            {row.side}
          </td>
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
  <p class="secondary">{difference}</p>
{/each}
{#if data.source !== null}
  <p class="secondary">{data.source}</p>
{/if}
{#if data.provisional !== null}
  <p class="secondary">{data.provisional}</p>
{/if}
{#if data.note !== null}
  <section>
    <h2>{t.NOTE_HEADING}</h2>
    <p class="secondary">{data.note}</p>
  </section>
{/if}

<SelectionBar {t} {selection} box={selectionBox} />

<style>
  /* A word too long for its line breaks, hyphenated where the browser knows the page's language
     (spec small-screens; design of add-small-screens, decision 6). `anywhere`, not `break-word`:
     it also lets the grids of the verdict boxes narrow below their longest word, which a browser
     without a hyphenation dictionary needs from 640 pixels, two results side by side. */
  h1,
  .verdict {
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  /* The selection's result beside the vote's own from 640 pixels, below it otherwise (design of
     add-limits, decision 9). */
  .results {
    display: grid;
    gap: 1rem;
  }
  @media (min-width: 640px) {
    .results {
      grid-template-columns: 1fr 1fr;
    }
  }
  caption {
    text-align: left;
    font-weight: bold;
  }
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
    border: 1px solid var(--border);
    padding: 0 1rem;
  }
  /* In a narrow window the boxes keep side by side with less padding and a smaller heading, so
     that "Maggioranza dei Cantoni" wraps between its words without hyphenation (design of
     add-small-screens, decision 6). */
  @media (max-width: 639.98px) {
    .verdict {
      padding: 0 0.5rem;
    }
    .verdict h2 {
      font-size: 1.25rem;
    }
  }
  .word,
  .outcome {
    font-size: 1.5rem;
    font-weight: bold;
  }
  .greyed {
    /* The lightest grey with WCAG's 4.5:1 on white (4.54:1); GrayText gives only 3.95:1. */
    color: var(--greyed);
  }
  td,
  th {
    padding: 0.125rem 0.75rem 0.125rem 0;
    text-align: left;
  }
</style>
