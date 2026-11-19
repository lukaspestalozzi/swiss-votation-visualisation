<script lang="ts">
  import type { Snippet } from 'svelte';
  import fontFile from '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url';
  import '../app.css';

  // Every page, the pages that redirect included, has the site's stylesheet (spec site-style;
  // design of add-site-style, decision 2). The font's Latin file is preloaded, so that it is
  // requested with the page rather than once the stylesheet is read; its address is the one the
  // stylesheet names, so a page requests it once.
  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <link rel="preload" href={fontFile} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}
