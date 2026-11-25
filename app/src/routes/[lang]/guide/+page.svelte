<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { textsOf } from '../../../lib/texts/index.ts';
  import type { PageProps } from './$types';

  // The reading guide (spec reading-guide): that a selection is a thought experiment, how it
  // works, and the sources of everything the site shows. It is one column of text (design of
  // redesign-site, decision 27).
  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));
</script>

<svelte:head>
  <title>{t.GUIDE_HEADING} – {t.TITLE}</title>
</svelte:head>

<div class="column">
  <nav><a href={resolve('/[lang]', { lang: data.lang })}>{t.ALL_VOTES}</a></nav>
  <h1>{t.GUIDE_HEADING}</h1>
  {#each t.GUIDE_SECTIONS as section (section.heading)}
    <section>
      <h2>{section.heading}</h2>
      {#each section.paragraphs as paragraph (paragraph)}
        <p>{paragraph}</p>
      {/each}
    </section>
  {/each}
  <section>
    <h2>{t.SOURCES_HEADING}</h2>
    <p>{t.SOURCE_VOTES}</p>
    <p>{t.sourceMap(data.mapDate, data.lakesSet)}</p>
    <p>{t.SOURCE_CHARACTERISTICS}</p>
    <p>{t.SOURCES_FILE} <a href={asset('data/sources.json')}>data/sources.json</a></p>
  </section>
</div>

<style>
  /* One column of text; a paragraph keeps the page's 40rem. A line parts the sections. */
  .column {
    max-width: 42rem;
  }
  h1 {
    margin-bottom: 1.5rem;
  }
  section + section {
    margin-top: 2.5rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--hairline);
  }
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
  }
  p {
    margin: 0.75rem 0 0;
    font-size: 1.0625rem;
    line-height: 1.6;
  }
</style>
