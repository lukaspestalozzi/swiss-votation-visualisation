<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { applyingTo, type Definition } from '../../../lib/characteristics.ts';
  import {
    comparisonLinkOf,
    comparisonOf,
    readAnew,
    secondChoices,
    tableOf,
    withSelection,
    type VoteTable,
  } from '../../../lib/comparison.ts';
  import {
    isNarrowed,
    remainingUnder,
    trackOf,
    type LimitSetting,
    type Track,
  } from '../../../lib/limits.ts';
  import { voteEntriesOf, type VoteEntries } from '../../../lib/result-map.ts';
  import { linkOf, selectionOf } from '../../../lib/share-link.ts';
  import { textsOf } from '../../../lib/texts/index.ts';
  import type { CharacteristicsFile, VoteFile } from '../../../lib/vote-data.ts';
  import { judgedOfFile, type ResultShown } from '../../../lib/vote-page.ts';
  import Limits from '../votes/[id]/Limits.svelte';
  import { loadCharacteristics } from '../votes/[id]/loaders.ts';
  import type { PageProps } from './$types';
  import ComparedVote from './ComparedVote.svelte';
  import { loadEntries } from './loaders.ts';

  // The comparison of two votes (spec vote-comparison): one selection applied to two votes, the
  // same municipalities counting in both (design of add-vote-comparison).
  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));

  // The votes the comparison offers, by id, and the chosen ones: the first, and the second.
  const judged = $derived(new Set(data.votes.map((vote) => vote.id)));
  let first = $state<number | null>(null);
  let second = $state<number | null>(null);
  const firstVote = $derived(data.votes.find((vote) => vote.id === first));
  // The second list: the votes but the first, those of its day first (design, decision 5).
  const seconds = $derived(first === null ? [] : secondChoices(data.votes, first));

  // The selection: the limits, on the tracks of the first vote, and the switch for the Swiss
  // abroad (design, decision 2). The characteristics are those a vote's page loads.
  let limits = $state.raw<readonly LimitSetting[]>([]);
  let abroadCounted = $state(true);
  let characteristics = $state.raw<CharacteristicsFile | null>(null);
  let characteristicsFailed = $state(false);
  // The selection's part of the address, and the parts of its `votes` the page could not use,
  // until the page has the characteristics and a first vote to read the selection on (design,
  // decision 8).
  let unread: { link: string; unusable: readonly string[] } | null = null;
  // How often the page has read a selection: it writes the address only once it has read one, and
  // anew after every reading, as a vote's page does (design, decision 8).
  let readings = $state(0);

  // The votes the address names, once the page is in the browser, and its selection once the
  // characteristics have loaded (design, decision 8).
  onMount(() => {
    readAddress();
    loadCharacteristics().then(
      (loaded) => {
        characteristics = loaded;
        readSelection();
      },
      () => {
        characteristicsFailed = true;
      },
    );
  });

  /** Take the votes the page's address names, and its selection once the page can read it. */
  function readAddress(): void {
    const read = comparisonOf(location.hash.slice(1), judged);
    first = read.votes[0] ?? null;
    second = read.votes[1] ?? null;
    unread = { link: read.rest, unusable: read.unusable };
    readSelection();
  }

  /** The tracks of the characteristics that apply to the vote of `date`. */
  function tracksOf(file: CharacteristicsFile, date: string): (definition: Definition) => Track {
    const applying = applyingTo(file, date);
    return (definition) => trackOf(definition, file, applying);
  }

  /** Take the selection the address held, on the first vote's tracks, once the page has them. */
  function readSelection(): void {
    if (unread === null || characteristics === null || firstVote === undefined) return;
    const read = selectionOf(unread.link, tracksOf(characteristics, firstVote.date));
    limits = read.limits;
    abroadCounted = read.abroadCounted;
    unusable = [...unread.unusable, ...read.unusable];
    unread = null;
    readLink = link;
    readings += 1;
  }

  // The comparison in the page's address (spec vote-comparison): the votes chosen and the
  // selection, written once they have stayed the same for half a second, as a vote's page writes
  // its selection (design, decision 8).
  const link = $derived(
    comparisonLinkOf(
      [first, second].filter((id) => id !== null),
      linkOf(limits, abroadCounted),
    ),
  );
  // The parts of the address the page could not use, which it names until the visitor next
  // changes the comparison: until its link differs from the one read (design of add-share-link,
  // decision 4).
  let unusable = $state.raw<readonly string[]>([]);
  let readLink = '';
  $effect(() => {
    if (link !== readLink) unusable = [];
  });

  $effect(() => {
    if (readings === 0) return;
    const hash = link === '' ? '' : `#${link}`;
    const timer = setTimeout(() => {
      // Compared with the browser's address and with the address as SvelteKit knows it, which the
      // language switch carries, as on a vote's page.
      if (hash === location.hash && hash === (page.shallow?.url ?? page.url).hash) return;
      // The page's own path as the browser shows it, with only its hash changed, as on a vote's
      // page: the rule accepts no address built from `resolve`, which drops the final slash.
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- the page's own path
      void goto(`${page.url.pathname}${hash}`, { shallow: true, replace: true });
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  });

  // The chosen votes' files of entries, as they arrive, each requested once per visit (design,
  // decision 3).
  const files = new SvelteMap<number, VoteFile | 'failed'>();
  $effect(() => {
    for (const id of [first, second]) {
      if (id === null || files.has(id)) continue;
      loadEntries(id).then(
        (file) => {
          files.set(id, file);
        },
        () => {
          files.set(id, 'failed');
        },
      );
    }
  });

  // Each chosen vote with its real result and, once the characteristics have loaded, its entries
  // per canton: made when its file arrives, not anew at each step of a slider.
  const chosen = $derived(
    [first, second].flatMap((id) => {
      const vote = data.votes.find((candidate) => candidate.id === id);
      if (vote === undefined) return [];
      const file = files.get(vote.id);
      const made: { real: ResultShown; entries: VoteEntries | null } | 'loading' | 'failed' =
        file === undefined || file === 'failed'
          ? (file ?? 'loading')
          : {
              real: judgedOfFile(`vote ${String(vote.id)}`, file, vote.majorities, t),
              entries:
                characteristics === null
                  ? null
                  : voteEntriesOf(file, characteristics.municipalities, data.swissAbroad),
            };
      return [{ vote, made }];
    }),
  );

  // The municipalities that remain under the limits, once the characteristics are loaded; they
  // count in both votes (design, decision 2).
  const remaining = $derived(
    characteristics === null ? null : remainingUnder(characteristics.municipalities, limits),
  );
  // A selection applies while a limit is narrowed or the Swiss abroad are not counted.
  const applies = $derived(!abroadCounted || limits.some(isNarrowed));

  // Each chosen vote with its table, or what stands in its place while its file loads or when it
  // cannot be loaded.
  const shown = $derived(
    chosen.map(({ vote, made }) => {
      if (made === 'loading' || made === 'failed') return { vote, table: made };
      const selected =
        applies && remaining !== null && made.entries !== null
          ? withSelection(made.entries, vote.majorities, remaining, abroadCounted, t)
          : null;
      const table: VoteTable = tableOf(made.real, selected, t);
      return { vote, table };
    }),
  );

  /** The vote a list's value names, or none for its empty choice. */
  const voteOf = (value: string) => (value === '' ? null : Number(value));

  function chooseFirst(value: string): void {
    first = voteOf(value);
    // The second list does not offer the first vote, nor anything without one.
    if (first === null || second === first) second = null;
    // The selection, read anew on the new first vote's tracks (design, decision 9), or the
    // address's, which no first vote has read yet.
    if (unread !== null) {
      readSelection();
    } else if (characteristics !== null && firstVote !== undefined) {
      const anew = readAnew(limits, abroadCounted, tracksOf(characteristics, firstVote.date));
      limits = anew.limits;
      abroadCounted = anew.abroadCounted;
    }
  }
</script>

<svelte:head>
  <title>{t.COMPARE_HEADING} – {t.TITLE}</title>
</svelte:head>

<!-- A link to the comparison opened in its tab changes only the hash (spec share-link, "A link in
     the same tab"). -->
<svelte:window onhashchange={readAddress} />

<h1>{t.COMPARE_HEADING}</h1>
<div class="choices">
  <label>
    {t.FIRST_VOTE}
    <select
      value={first === null ? '' : String(first)}
      onchange={(event) => {
        chooseFirst(event.currentTarget.value);
      }}
    >
      <option value="">{t.CHOOSE}</option>
      {#each data.votes as vote (vote.id)}
        <option value={String(vote.id)}>{vote.choice}</option>
      {/each}
    </select>
  </label>
  <label>
    {t.SECOND_VOTE}
    <select
      value={second === null ? '' : String(second)}
      onchange={(event) => {
        second = voteOf(event.currentTarget.value);
      }}
    >
      <option value="">{t.CHOOSE}</option>
      {#each seconds as vote (vote.id)}
        <option value={String(vote.id)}>{vote.choice}</option>
      {/each}
    </select>
  </label>
</div>
{#if unusable.length > 0}
  <p>{t.unusableParts(unusable)}</p>
{/if}
<div class="tables">
  {#each shown as { vote, table } (vote.id)}
    <ComparedVote {t} {vote} {table} />
  {/each}
</div>
{#if firstVote !== undefined}
  <p>{t.SAME_MUNICIPALITIES}</p>
  <Limits
    {t}
    file={characteristics}
    failed={characteristicsFailed}
    voteDate={firstVote.date}
    count={null}
    unusable={[]}
    bind:limits
    bind:abroadCounted
  />
{/if}
