<script lang="ts">
  import { resolve } from '$app/paths';
  import { textsOf } from '../../lib/texts/index.ts';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));
</script>

<svelte:head>
  <title>{t.TITLE}</title>
</svelte:head>

<h1>{t.TITLE}</h1>

{#each data.years as year (year.year)}
  <section>
    <h2>{year.year}</h2>
    <ul>
      {#each year.entries as entry (entry.id)}
        <li>
          <span class="secondary">{entry.date}</span>
          <a href={resolve('/[lang]/votes/[id]', { lang: data.lang, id: String(entry.id) })}
            >{entry.title}</a
          >
          <span class="secondary">{entry.kind}</span>
          <span class:side-yes={entry.side === 'yes'} class:side-no={entry.side === 'no'}
            >{entry.result}</span
          >
          {#each entry.marks as mark (mark)}
            <span class="mark">{mark}</span>
          {/each}
        </li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  ul {
    padding: 0;
    list-style: none;
  }
  li {
    margin-bottom: 0.75rem;
  }
  li > * {
    margin-right: 0.5rem;
  }
  a {
    font-weight: bold;
  }
  .mark {
    border: 1px solid;
    padding: 0 0.25rem;
  }
</style>
