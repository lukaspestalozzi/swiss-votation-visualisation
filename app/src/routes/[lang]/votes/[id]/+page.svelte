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
  import VoteSummary from './VoteSummary.svelte';

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
  // How many of the municipalities with an entry remain, as a sentence and as their share for
  // its bar (spec limits, "The number of municipalities that remain"); none until the
  // characteristics have loaded.
  const count = $derived.by(() => {
    if (remaining === null || data.entries === null) return null;
    const left = remainingOf(withEntry, remaining);
    return {
      text:
        left === 0
          ? t.NOTHING_REMAINS
          : t.remainingCount(formatCount(left), formatCount(withEntry.length)),
      share: withEntry.length === 0 ? 0 : left / withEntry.length,
    };
  });
  // The row "Mit Ihrer Auswahl", which the bar at the bottom of a narrow window repeats while it is
  // not wholly on the screen (spec small-screens).
  let selectionBox = $state<HTMLElement | null>(null);
  // Each canton's yes share in the vote's real result, in percent, which a mark shows in the table
  // of the cantons while a selection applies (spec verdicts, "The bar of a canton").
  const realShares = $derived(
    new Map((data.judged?.cantons ?? []).map((row) => [row.canton, row.yesPercent])),
  );
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
<VoteSummary summary={data.summary} />

{#if data.judged !== null}
  {@const judged = data.judged}
  <!-- The workbench (design of redesign-site, decisions 8 and 9): what a visitor watches, the
       result and the map, beside what they set, the limits, in a window at least 1,024 pixels
       wide. In a narrower one the stylesheet shows the result, the limits, the map, so that a
       phone shows the selection's result while a limit is set; the document's order stays. -->
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
            <div class="place"><p>{t.SELECTION_PLACE}</p></div>
          {/if}
        </div>
        {#if data.entries !== null}
          <ResultMap {t} entries={data.entries} {aside} title={data.title} bind:clicked />
        {/if}
      </div>
      {#if data.entries !== null}
        <div class="notes"><MapNotes {t} entries={data.entries} /></div>
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
          {clicked}
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
    <!-- The cantons (spec verdicts, "The table of the cantons" and "The bar of a canton"; design
         of redesign-site, decision 18): each row's yes share with a bar on a track of 0 to 100%,
         from the middle to the share, in its side's colour; under a selection, a mark at the
         canton's real share. A row without a yes share has neither. -->
    <section class="canton-results">
      <h2>{t.CANTONS_HEADING}</h2>
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
            {@const share = row.yesPercent}
            {@const real = selection === null ? null : (realShares.get(row.canton) ?? null)}
            <tr>
              <th scope="row">{row.canton}</th>
              <!-- The cell's text is the share alone: nothing stands between its parts. -->
              <td class="share"
                ><span class="figure">{row.yesShare}</span>{#if share !== null}<span
                    class="canton-bar"
                    aria-hidden="true"
                    ><span
                      class="fill"
                      class:yes={row.forSide === 'yes'}
                      style:left="{Math.min(share, 50)}%"
                      style:width="{Math.abs(share - 50)}%"
                    ></span>{#if real !== null}<span class="real" style:left="{real}%"
                      ></span>{/if}</span
                  >{/if}</td
              >
              <td>{row.cantonalVotes}</td>
              <td class:side-yes={row.forSide === 'yes'} class:side-no={row.forSide === 'no'}>
                {row.side}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="canton-note secondary">
        {selection === null ? t.CANTON_BARS : t.CANTON_BARS_SELECTION}
      </p>
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
     whose column is 307 to 384 pixels wide. */
  .workbench {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
  /* The column of the result and the map names its width, by which the map leaves the result
     its room (`ResultMap.svelte`). */
  .watch {
    min-width: 0;
    container: watch / inline-size;
  }
  .stay {
    display: grid;
    gap: 1.25rem;
  }
  /* In a narrower window the limits stand between the result and the map (spec limits, "The
     limits on a vote's page"): the result's column gives its parts to the workbench, which
     shows them in this order. A screen reader and the Tab key follow the document: the result,
     the map, the limits (design of redesign-site, decision 9). */
  @media (max-width: 1023.98px) {
    .workbench {
      gap: 0;
    }
    .watch,
    .stay {
      display: contents;
    }
    .setting {
      order: 1;
      margin-top: 2.5rem;
    }
    .stay > :global(.map) {
      order: 2;
      margin-top: 2.5rem;
    }
    .notes {
      order: 3;
    }
  }
  @media (min-width: 1024px) {
    .workbench {
      grid-template-columns: minmax(0, 1fr) clamp(19rem, 30vw, 24rem);
      gap: 3rem;
    }
    /* What grows in this column, as the legend does by a line when it gains the key of the
       set-aside municipalities, moves nothing in the limits' column: the browser keeps the
       page where it is by a part of the limits, not by one of this column. */
    .watch {
      overflow-anchor: none;
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
  /* The place of the selection's result, below the vote's: a box as wide as the results, its
     sentence a paragraph of the page's width. */
  .place {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 10px;
    color: var(--text-secondary);
  }
  .place p {
    margin: 0;
  }
  /* The place is as tall as the result that takes it, so that neither the map nor the limits
     move under the pointer or the finger when a selection first applies (spec verdicts, "The
     place of the selection's result"): the two are rows of one height. The room between them
     and the selection's line are then the vote's row's, below it, as tall as the selection's
     own room and line above it (`ResultRow.svelte`). */
  .results {
    display: grid;
    grid-auto-rows: 1fr;
  }
  .results > :global(.result:first-child) {
    padding-bottom: calc(0.875rem + 1px);
  }
  .results > :global(.result.selection) {
    margin-top: 0;
  }
  /* The cantons: a heading as the panel's, above a line; a table as wide as its column, a line
     between its rows. */
  .canton-results h2 {
    margin: 0 0 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--hairline);
    font-size: 1.375rem;
    line-height: 1.2;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  td,
  th {
    padding: 0.25rem 0.75rem 0.25rem 0;
    border-top: 1px solid var(--hairline);
    text-align: left;
    white-space: nowrap;
  }
  thead th {
    border-top: 0;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--text-secondary);
  }
  td:last-child,
  th:last-child {
    padding-right: 0;
  }
  /* The yes share's cell takes the room the other columns leave: the figure, then its bar. */
  .share {
    width: 100%;
  }
  .figure {
    display: inline-block;
    width: 3.75rem;
  }
  /* A canton's bar: a thin track of 0 to 100% with a line at its middle, the fill from the
     middle to the yes share, and the mark of the real share. */
  .canton-bar {
    position: relative;
    display: inline-block;
    width: calc(100% - 4.25rem);
    min-width: 4rem;
    height: 0.75rem;
    vertical-align: middle;
    background:
      linear-gradient(var(--text), var(--text)) center / 1px 100% no-repeat,
      linear-gradient(var(--track), var(--track)) center / 100% 2px no-repeat;
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--no-bar);
  }
  .fill.yes {
    background: var(--yes-bar);
  }
  .real {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    margin-left: -1px;
    background: var(--text);
    box-shadow: 0 0 0 1px var(--ground);
  }
  .canton-note {
    margin: 0.75rem 0 0;
    font-size: 0.875rem;
  }
  /* In a narrow window the table still fits: less room between its columns, a shorter bar, and
     "keine Gemeinde übrig" on as many lines as it needs (spec small-screens). */
  @media (max-width: 639.98px) {
    td,
    th {
      padding-right: 0.5rem;
    }
    td:nth-child(3) {
      white-space: normal;
    }
    .canton-bar {
      min-width: 3rem;
    }
  }
</style>
