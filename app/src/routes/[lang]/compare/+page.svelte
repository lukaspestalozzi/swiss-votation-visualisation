<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { comparisonOf, secondChoices, tableOf, type VoteTable } from '../../../lib/comparison.ts';
  import { textsOf } from '../../../lib/texts/index.ts';
  import type { VoteFile } from '../../../lib/vote-data.ts';
  import { judgedOfFile } from '../../../lib/vote-page.ts';
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
  // The second list: the votes but the first, those of its day first (design, decision 5).
  const seconds = $derived(first === null ? [] : secondChoices(data.votes, first));

  // The votes the address names, once the page is in the browser (design, decision 8).
  onMount(() => {
    const read = comparisonOf(location.hash.slice(1), judged);
    first = read.votes[0] ?? null;
    second = read.votes[1] ?? null;
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

  // Each chosen vote with its table, or what stands in its place while its file loads or when it
  // cannot be loaded.
  const shown = $derived(
    [first, second].flatMap((id) => {
      const vote = data.votes.find((candidate) => candidate.id === id);
      if (vote === undefined) return [];
      const file = files.get(vote.id);
      const table: VoteTable | 'loading' | 'failed' =
        file === undefined || file === 'failed'
          ? (file ?? 'loading')
          : tableOf(judgedOfFile(`vote ${String(vote.id)}`, file, vote.majorities, t), null, t);
      return [{ vote, table }];
    }),
  );

  /** The vote a list's value names, or none for its empty choice. */
  const voteOf = (value: string) => (value === '' ? null : Number(value));

  function chooseFirst(value: string): void {
    first = voteOf(value);
    // The second list does not offer the first vote, nor anything without one.
    if (first === null || second === first) second = null;
  }
</script>

<svelte:head>
  <title>{t.COMPARE_HEADING} – {t.TITLE}</title>
</svelte:head>

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
<div class="tables">
  {#each shown as { vote, table } (vote.id)}
    <ComparedVote {t} {vote} {table} />
  {/each}
</div>
