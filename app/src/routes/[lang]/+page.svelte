<script lang="ts">
  import { resolve } from '$app/paths';
  import { textsOf } from '../../lib/texts/index.ts';
  import { listShown, type Kept } from '../../lib/vote-list.ts';
  import ShareBar from './ShareBar.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));

  // What the visitor looks for: the words typed and the result kept. Neither is stored, sent or
  // written to the address (spec vote-list, "Finding a vote by its title"). The page is built
  // with neither, so that without scripts the list is whole.
  let typed = $state('');
  let kept = $state<Kept>('all');
  const shown = $derived(listShown(data.years, typed, kept));
  const buttons = $derived<[Kept, string][]>([
    ['all', t.KEEP_ALL],
    ['yes', t.KEEP_ACCEPTED],
    ['no', t.KEEP_REJECTED],
  ]);

  // The height of the part that stays at the top of the window, as the browser lays it out: a
  // year's heading stays below it, and a link to a year brings the year's top below it.
  let staying = $state<number>();
</script>

<svelte:head>
  <title>{t.TITLE}</title>
</svelte:head>

<!-- The start page (spec vote-list; design of redesign-site, decision 24): the question the site
     answers, one sentence, and the votes by year and vote day. A row is its vote's title, a
     link, with the kind below it, the bar of the official yes share, the share and the result;
     the link reaches over the whole row, so that the row leads to the vote and the link is named
     by the title alone. Above the list, the search field, the three buttons and a link per year
     stay at the top of the window (decision 25). -->
<h1>{t.START_HEADING}</h1>
<p class="lead">{t.startLead(data.furtherCharacteristics)}</p>

<div class="finder" bind:offsetHeight={staying}>
  <input
    class="search"
    type="search"
    placeholder={t.SEARCH_TITLES}
    aria-label={t.SEARCH_TITLES}
    bind:value={typed}
  />
  <div class="kept" role="group" aria-label={t.KEPT}>
    {#each buttons as [value, name] (value)}
      <button type="button" aria-pressed={kept === value} onclick={() => (kept = value)}
        >{name}</button
      >
    {/each}
  </div>
  <nav class="years" aria-label={t.YEARS}>
    {#each shown as year (year.year)}
      <a href="#y{year.year}">{year.year}</a>
    {/each}
  </nav>
</div>

{#if shown.length === 0}
  <p class="no-match">{t.NO_MATCH}</p>
{/if}

{#each shown as year (year.year)}
  <section
    class="year"
    id="y{year.year}"
    style:--finder={staying === undefined ? null : `${String(staying)}px`}
  >
    <h2>{year.year}</h2>
    <div>
      {#each year.days as day (day.day)}
        <div class="day">
          <h3 class="day-date">{day.day}</h3>
          <ul>
            {#each day.entries as entry (entry.id)}
              <li class="vote-row">
                <span class="vote-title">
                  <a href={resolve('/[lang]/votes/[id]', { lang: data.lang, id: String(entry.id) })}
                    >{entry.title}</a
                  >
                  <span class="vote-kind">{entry.kind}</span>
                </span>
                {#if entry.yesPercent !== null}
                  <ShareBar percent={entry.yesPercent} />
                {/if}
                <span class="vote-share" class:alone={entry.yesPercent === null}>{entry.share}</span
                >
                <span class="vote-result">
                  {#if entry.verdict !== null}
                    <span
                      class="vote-verdict"
                      class:side-yes={entry.side === 'yes'}
                      class:side-no={entry.side === 'no'}>{entry.verdict}</span
                    >
                  {/if}
                  {#each entry.marks as mark (mark)}
                    <span class="mark">{mark}</span>
                  {/each}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </section>
{/each}

<style>
  h1 {
    max-width: 17em;
    margin: 2.5rem 0 0;
    font-size: clamp(2rem, 1rem + 3.2vw, 3.5rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .lead {
    max-width: 34rem;
    margin: 1.25rem 0 3rem;
    font-size: 1.1875rem;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  /* The search field, the three buttons and the years stay at the top of the window, over the
     rows that pass below them, whose ground reaches half a rem beyond the list on each side. */
  .finder {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    margin: 0 -0.5rem;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--hairline);
    background: var(--ground);
  }
  /* The field gives way before the buttons take a line of their own. */
  .search {
    box-sizing: border-box;
    flex: 1 1 12rem;
    max-width: 18rem;
    min-width: 0;
    height: 2.5rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    background: var(--ground);
  }
  .search::placeholder {
    color: var(--text-secondary);
    opacity: 1;
  }
  .kept {
    display: flex;
    gap: 0.375rem;
  }
  button {
    min-width: 2.75rem;
    height: 2.5rem;
    padding: 0.25rem 0.875rem;
    border-radius: 999px;
  }
  button[aria-pressed='true'] {
    border-color: var(--text);
    color: var(--ground);
    background: var(--text);
    font-weight: 600;
  }
  /* The years in one line, which a narrow window moves sideways; the room around them is the
     ring's of a year that has the focus. */
  .years {
    display: flex;
    flex-basis: 100%;
    gap: 0.25rem 1rem;
    margin: -4px;
    padding: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    line-height: 1.5rem;
    font-variant-numeric: tabular-nums;
  }
  .years a {
    font-weight: 400;
    color: var(--text-secondary);
    text-decoration-line: none;
  }
  .years a::after {
    content: none;
  }
  .years a:hover {
    color: var(--text);
    text-decoration-line: underline;
  }
  .no-match {
    margin: 2rem 0;
  }

  /* A year: its number to the left of its vote days, staying in the window while they pass,
     below the part above; a link to the year brings its top below that part. Its height is the
     page's measure of it, and without scripts the height of its padding, the field, the gap
     and the years' line. */
  .year {
    --finder: 6.5rem;
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr);
    gap: 0 1.5rem;
    padding-top: 2rem;
    scroll-margin-top: var(--finder);
  }
  h2 {
    position: sticky;
    top: calc(var(--finder) + 1rem);
    align-self: start;
    margin: 0;
    font-size: 2rem;
    font-weight: 300;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  /* A vote day: its day and month to the left of its rows. */
  .day {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: 0 1.5rem;
    border-top: 1px solid var(--border);
  }
  .day-date {
    margin: 0;
    padding-top: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-secondary);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* A row: the title with the kind, the bar, the share and the result, the last three in columns
     of their own so that they stand one below the other from row to row. */
  .vote-row {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 5.5rem 6.5rem 10.5rem;
    gap: 0 1.25rem;
    align-items: baseline;
    margin: 0 -0.5rem;
    padding: 0.5rem;
  }
  .vote-row + .vote-row {
    border-top: 1px solid var(--hairline);
  }
  .vote-row:hover {
    background: var(--hover);
  }
  .vote-title {
    grid-column: 1;
    line-height: 1.3;
  }
  /* The title is underlined while its row is pointed at; the link reaches over the whole row. */
  a {
    font-weight: 600;
    text-decoration-line: none;
  }
  .vote-row:hover a {
    text-decoration-line: underline;
  }
  a::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .vote-kind {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  /* The bar on the title's first line, where the share stands. */
  .vote-row :global(.bar) {
    grid-column: 2;
    align-self: start;
    height: 0.5rem;
    margin: calc((1.3rem - 0.5rem) / 2) 0 0;
  }
  .vote-row :global(.bar > .half) {
    top: -3px;
    bottom: -3px;
  }
  .vote-share {
    grid-column: 3;
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  /* A tie-break question's share has no bar before it and takes its room too. */
  .vote-share.alone {
    grid-column: 2 / 4;
  }
  .vote-result {
    grid-column: 4;
    white-space: nowrap;
  }
  .vote-verdict {
    font-weight: 600;
  }
  .mark {
    margin-left: 0.125rem;
    padding: 0 0.3125rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  /* Below 1,024 pixels the three columns leave a title too little room: a row in two lines, the
     title, then the bar, the share and the result, which may break. */
  @media (max-width: 1023.98px) {
    .vote-row {
      grid-template-columns: 4.5rem auto minmax(0, 1fr);
      gap: 0.125rem 0.75rem;
      align-items: center;
    }
    .vote-title {
      grid-column: 1 / -1;
    }
    .vote-row :global(.bar) {
      grid-column: 1;
      align-self: center;
      margin: 0;
    }
    .vote-share {
      grid-column: 2;
      text-align: left;
    }
    .vote-share.alone {
      grid-column: 1 / 3;
    }
    .vote-result {
      grid-column: 3;
      white-space: normal;
    }
  }

  /* Below 768 pixels the year stands above its days and a day above its rows. */
  @media (max-width: 767.98px) {
    .year,
    .day {
      grid-template-columns: minmax(0, 1fr);
    }
    h2 {
      position: static;
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
    }
  }

  /* A narrow window: the field in a line of its own, the buttons below it. */
  @media (max-width: 639.98px) {
    h1 {
      margin-top: 1.25rem;
    }
    .lead {
      margin-bottom: 2rem;
    }
    .search {
      flex-basis: 100%;
      max-width: none;
    }
    .year {
      --finder: 10rem;
    }
  }

  /* On a touch screen the field and the buttons are at least 44 pixels tall and wide (spec
     small-screens, "Controls for a finger"). */
  @media (pointer: coarse) {
    .search,
    button {
      min-width: 44px;
      height: 44px;
    }
  }
</style>
