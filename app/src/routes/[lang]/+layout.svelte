<script lang="ts">
  import type { Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { ResolvedPathname } from '$app/types';
  import { LANGUAGES, LANGUAGE_NAMES, textsOf, type Language } from '../../lib/texts/index.ts';
  import type { LayoutProps } from './$types';

  // The switch at the top of every page (spec interface-languages, "Changing the language";
  // design of add-interface-languages, decision 12): the three languages in their own words, the
  // page's own as text, the others linking to this page in them. A link loads the page anew, so
  // that it has its own `lang` and nothing of this page is carried over.
  let { data, children }: LayoutProps & { children: Snippet } = $props();
  const t = $derived(textsOf(data.lang));

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

<!-- The head of every page (spec site-style, "The head of every page"; design of add-site-style,
     decision 7): the working title, the guide and the language switch, each a link but on its
     own page, where it is text, as the switch's own language is. -->
<header class="head">
  {#if page.route.id === '/[lang]'}
    <span class="title" aria-current="page">{t.TITLE}</span>
  {:else}
    <a class="title" href={resolve('/[lang]', { lang: data.lang })}>{t.TITLE}</a>
  {/if}
  {#if page.route.id === '/[lang]/guide'}
    <span aria-current="page">{t.GUIDE_HEADING}</span>
  {:else}
    <a href={resolve('/[lang]/guide', { lang: data.lang })}>{t.GUIDE_HEADING}</a>
  {/if}
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
</header>

{@render children()}

<style>
  /* The head wraps between its parts, never within one: in a window 360 pixels wide the switch
     takes a second line. */
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 1.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
  }
  .head a,
  .head span {
    white-space: nowrap;
  }
  .title {
    font-weight: bold;
  }
  .languages {
    display: flex;
    gap: 0.75rem;
    margin-left: auto;
  }
</style>
