<script lang="ts">
  import type { Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { ResolvedPathname } from '$app/types';
  import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../../lib/texts/index.ts';
  import type { LayoutProps } from './$types';

  // The switch at the top of every page (spec interface-languages, "Changing the language";
  // design of add-interface-languages, decision 12): the three languages in their own words, the
  // page's own as text, the others linking to this page in them. A link loads the page anew, so
  // that it has its own `lang` and nothing of this page is carried over.
  let { data, children }: LayoutProps & { children: Snippet } = $props();

  /**
   * This page's address in `language`, by its route (Q, 2026-11-17: each route resolved, so that
   * every link passes through `resolve`). A route the switch does not know is an error.
   */
  function addressIn(language: Language): ResolvedPathname {
    const route = page.route.id;
    switch (route) {
      case '/[lang]':
        return resolve('/[lang]', { lang: language });
      case '/[lang]/guide':
        return resolve('/[lang]/guide', { lang: language });
      case '/[lang]/votes/[id]': {
        const { id } = page.params;
        if (id === undefined) throw new Error('the page of a vote has no id');
        return resolve('/[lang]/votes/[id]', { lang: language, id });
      }
      default:
        throw new Error(`the language switch knows no route ${String(route)}`);
    }
  }
</script>

<nav class="languages">
  {#each LANGUAGES as language (language)}
    {#if language === data.lang}
      <span lang={language} aria-current="page">{LANGUAGE_NAMES[language]}</span>
    {:else}
      <a href={addressIn(language)} lang={language} hreflang={language} data-sveltekit-reload
        >{LANGUAGE_NAMES[language]}</a
      >
    {/if}
  {/each}
</nav>

{@render children()}

<style>
  .languages {
    display: flex;
    gap: 0.75rem;
  }
</style>
