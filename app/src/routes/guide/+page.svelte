<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import {
    ALL_VOTES,
    GUIDE_HEADING,
    GUIDE_SECTIONS,
    SOURCE_CHARACTERISTICS,
    SOURCE_VOTES,
    SOURCES_FILE,
    SOURCES_HEADING,
    TITLE,
    sourceMap,
  } from '../../lib/texts.ts';
  import type { PageProps } from './$types';

  // The reading guide (spec reading-guide): that a selection is a thought experiment, how it
  // works, and the sources of everything the site shows.
  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{GUIDE_HEADING} – {TITLE}</title>
</svelte:head>

<nav><a href={resolve('/')}>{ALL_VOTES}</a></nav>
<h1>{GUIDE_HEADING}</h1>
{#each GUIDE_SECTIONS as section (section.heading)}
  <section>
    <h2>{section.heading}</h2>
    {#each section.paragraphs as paragraph (paragraph)}
      <p>{paragraph}</p>
    {/each}
  </section>
{/each}
<section>
  <h2>{SOURCES_HEADING}</h2>
  <p>{SOURCE_VOTES}</p>
  <p>{sourceMap(data.mapDate, data.lakesSet)}</p>
  <p>{SOURCE_CHARACTERISTICS}</p>
  <p>{SOURCES_FILE} <a href={asset('data/sources.json')}>data/sources.json</a></p>
</section>

<style>
  section {
    max-width: 45rem;
  }
</style>
