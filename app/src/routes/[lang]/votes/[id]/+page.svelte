<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { ResolvedPathname } from '$app/types';
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
  import { comparisonLinkOf } from '../../../../lib/comparison.ts';
  import { linkOf, selectionOf } from '../../../../lib/share-link.ts';
  import { judgedOf } from '../../../../lib/vote-page.ts';
  import type { CharacteristicsFile } from '../../../../lib/vote-data.ts';
  import type { PageProps } from './$types';
  import CharacteristicsPanel from './CharacteristicsPanel.svelte';
  import Limits from './Limits.svelte';
  import MapNotes from './MapNotes.svelte';
  import { loadCharacteristics } from './loaders.ts';
  import ResultMap from './ResultMap.svelte';
  import ResultRow from './ResultRow.svelte';
  import ShareBar from '../../ShareBar.svelte';
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

  // The comparison with this vote first and the page's current selection, which the page written
  // at build time does not have (spec vote-comparison, "From a vote's page"; design of
  // add-vote-comparison, decision 10). A hash leaves the path that `resolve` gave as it was.
  const comparison = $derived(
    `${resolve('/[lang]/compare', { lang: data.lang })}#${comparisonLinkOf([data.id], link)}` as ResolvedPathname,
  );

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
  // The row "Mit Ihrer Auswahl", which the bar at the bottom of a narrow window repeats while it is
  // not wholly on the screen (spec small-screens).
  let selectionBox = $state<HTMLElement | null>(null);
  // The municipality last clicked or tapped on the map, whose characteristics the panel shows.
  let clicked = $state.raw<{ readonly number: number; readonly name: string } | null>(null);
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
  <!-- The workbench (design of redesign-site, decisions 8 and 9): what a visitor watches, the
       result and the map, beside what they set, the limits, in a window at least 1,024 pixels
       wide; in a narrower one the result, the map, the limits. -->
  <div class="workbench">
    <div class="watch">
      <div class="stay">
        <!-- The vote's result and, below it, the selection's, bar above bar; until a selection
             applies, a sentence says what will stand there (spec verdicts, "The place of the
             selection's result"). -->
        <div class="results">
          <ResultRow {t} heading={t.REAL_RESULT} result={judged} turnout={judged.turnout} />
          {#if selection !== null}
            <ResultRow
              {t}
              heading={t.WITH_SELECTION}
              result={selection}
              selection
              bind:element={selectionBox}
            />
          {:else if data.entries !== null && !characteristicsFailed}
            <p class="place">{t.SELECTION_PLACE}</p>
          {/if}
        </div>
        {#if data.entries !== null}
          <ResultMap {t} entries={data.entries} {aside} title={data.title} bind:clicked />
        {/if}
      </div>
      {#if data.entries !== null}
        <MapNotes {t} entries={data.entries} />
      {/if}
    </div>
    {#if data.entries !== null}
      <div class="setting">
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
        <p><a href={comparison}>{t.COMPARE_LINK}</a></p>
      </div>
    {/if}
  </div>

  <!-- Below the workbench: the municipality last clicked and, beside it in a window at least 960
       pixels wide, the cantons (spec result-map, "Where the panel stands"). -->
  <div class="below">
    {#if data.entries !== null}
      <CharacteristicsPanel
        {t}
        file={characteristics}
        failed={characteristicsFailed}
        number={clicked?.number ?? null}
        name={clicked?.name ?? null}
        voteDate={data.voteDate}
      />
    {/if}
    <section class="canton-results">
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
    </section>
  </div>
{/if}

{#if data.tieBreak !== null}
  <!-- The tie-break question is not judged, so its bar takes no side's colour (design of
       redesign-site, decision 14). -->
  <section class="tie-break">
    <p>{data.tieBreak.initiative}</p>
    <p>{data.tieBreak.counterProposal}</p>
    <ShareBar percent={data.tieBreak.initiativePercent} neutral />
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
     (spec small-screens; design of add-small-screens, decision 6). */
  h1 {
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  caption {
    text-align: left;
    font-weight: bold;
  }
  /* The workbench: one column, and from 1,024 pixels the result and the map beside the limits,
     whose column is 304 to 384 pixels wide. */
  .workbench {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
  .watch {
    min-width: 0;
  }
  .stay {
    display: grid;
    gap: 1.25rem;
  }
  @media (min-width: 1024px) {
    .workbench {
      grid-template-columns: minmax(0, 1fr) clamp(19rem, 30vw, 24rem);
      gap: 3rem;
    }
    .setting {
      align-self: start;
      padding-left: 2rem;
      border-left: 1px solid var(--hairline);
    }
  }
  /* In a window that is also at least 700 pixels high, the result and the map with its legend
     stay in it while the page scrolls along the limits (spec result-map, "The result and the map
     stay in the window"). Their column is as tall as the limits', so that they can; the lines
     below the legend scroll with the page and pass behind them, which is why they have the
     page's ground, from the window's top edge on. */
  @media (min-width: 1024px) and (min-height: 700px) {
    .stay {
      position: sticky;
      top: 0;
      z-index: 1;
      margin-top: -1rem;
      padding-top: 1rem;
      background: var(--ground);
    }
  }
  .below {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 3rem;
    margin-top: 3rem;
  }
  @media (min-width: 960px) {
    .below {
      grid-template-columns: minmax(0, 1fr) minmax(19rem, 25rem);
      align-items: start;
      margin-top: 4rem;
    }
  }
  /* The results are as wide as the room they have, by which a result arranges its parts
     (`ResultRow.svelte`). */
  .results {
    container-type: inline-size;
  }
  /* The tie-break question's bar is no wider than its lines of text. */
  .tie-break {
    max-width: 36rem;
  }
  /* The place of the selection's result, below the vote's. */
  .place {
    max-width: none;
    margin: 0.875rem 0 0;
    padding: 0.75rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 10px;
    color: var(--text-secondary);
  }
  td,
  th {
    padding: 0.125rem 0.75rem 0.125rem 0;
    text-align: left;
  }
</style>
