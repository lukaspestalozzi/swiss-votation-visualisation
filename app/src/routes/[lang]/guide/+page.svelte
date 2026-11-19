<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { textsOf } from '../../../lib/texts/index.ts';
  import type { PageProps } from './$types';

  // The reading guide (spec reading-guide): that a selection is a thought experiment, how it
  // works, and the sources of everything the site shows.
  let { data }: PageProps = $props();
  const t = $derived(textsOf(data.lang));
</script>

<svelte:head>
  <title>{t.GUIDE_HEADING} – {t.TITLE}</title>
</svelte:head>

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
