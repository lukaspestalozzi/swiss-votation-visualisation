<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import { redirectScript } from '../lib/languages.ts';
  import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/texts/index.ts';

  // A page without a language in its address (spec interface-languages, "The address without a
  // language" and "The addresses of before"; design of add-interface-languages, decision 4): a
  // script in the head opens the page in the browser's language. Its body names the page in the
  // three languages, for whatever stops the script.
  let { addresses }: { addresses: Readonly<Record<Language, ResolvedPathname>> } = $props();

  // The script opens the page at its address with the final slash, as the site writes its pages,
  // so that GitHub Pages need not redirect once more.
  // The tag is built here, its closing tag in two parts: written whole in the markup or in this
  // block, it would end them.
  const scriptTag = $derived(
    '<script>' +
      redirectScript({ de: `${addresses.de}/`, fr: `${addresses.fr}/`, it: `${addresses.it}/` }) +
      '</' +
      'script>',
  );
</script>

<svelte:head>
  <title>Popular Vote Explorer</title>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- the site's own script, built from its own addresses -->
  {@html scriptTag}
  <!-- Without scripts, the German page. -->
  <noscript><meta http-equiv="refresh" content="0; url={addresses.de}/" /></noscript>
</svelte:head>

<nav class="languages">
  {#each LANGUAGES as language (language)}
    <a href={addresses[language]} lang={language} hreflang={language}>{LANGUAGE_NAMES[language]}</a>
  {/each}
</nav>

<style>
  .languages {
    display: flex;
    gap: 0.75rem;
  }
</style>
