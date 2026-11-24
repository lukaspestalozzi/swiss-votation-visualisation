<script lang="ts">
  import type { Snippet } from 'svelte';
  import { browser } from '$app/env';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { ResolvedPathname } from '$app/types';
  import { LANGUAGES, LANGUAGE_NAMES, textsOf, type Language } from '../../lib/texts/index.ts';
  import type { LayoutProps } from './$types';

  // The switch at the top of every page (spec interface-languages, "The switch between the
  // languages"; design of add-interface-languages, decision 12): the three languages in their own
  // words, the page's own as text, the others linking to this page in them. A link loads the page
  // anew, so that it has its own `lang`; of this page it carries over only the selection its
  // address holds (spec share-link; design of add-share-link, decision 8).
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
      case '/[lang]/compare':
        return resolve('/[lang]/compare', { lang: language });
      case '/[lang]/votes/[id]': {
        const { id } = page.params;
        if (id === undefined) throw new Error('the page of a vote has no id');
        return resolve('/[lang]/votes/[id]', { lang: language, id });
      }
      default:
        throw new Error(`the language switch knows no route ${String(route)}`);
    }
  }

  // The hash of this page's address as SvelteKit knows it, which holds a vote's selection: that
  // of the last shallow `goto`, which leaves `page.url` as it was, or else the address the page
  // opened with (Q, 2026-11-20). In the browser only, as a page written at build time has none.
  const hash = $derived(browser ? (page.shallow?.url ?? page.url).hash : '');

  /** The link to this page in `language`, with the hash of this page's address. */
  function linkIn(language: Language): ResolvedPathname {
    // A hash leaves the path that `resolve` gave as it was.
    return `${addressIn(language)}${hash}` as ResolvedPathname;
  }
</script>

<!-- The head of every page (spec site-style, "The head of every page"; design of redesign-site,
     decisions 6 and 7): the working title with its mark, the comparison, the guide and the
     language switch, each a link but on its own page, where it is text, as the switch's own
     language is. The mark is drawn by the style below, so that no page gains an image. A language
     holds its code beside its name, which a narrow window writes in the name's place; a link is
     named with both at every width. On the start page and the guide the head is marked "narrow",
     by which `app.css` makes their page narrower. -->
<header
  class="head"
  class:narrow={page.route.id === '/[lang]' || page.route.id === '/[lang]/guide'}
>
  {#if page.route.id === '/[lang]'}
    <span class="title" aria-current="page"
      ><span class="mark" aria-hidden="true"></span>{t.TITLE}</span
    >
  {:else}
    <a class="title" href={resolve('/[lang]', { lang: data.lang })}
      ><span class="mark" aria-hidden="true"></span>{t.TITLE}</a
    >
  {/if}
  <div class="entries">
    {#if page.route.id === '/[lang]/compare'}
      <span aria-current="page">{t.COMPARE_ENTRY}</span>
    {:else}
      <a href={resolve('/[lang]/compare', { lang: data.lang })}>{t.COMPARE_ENTRY}</a>
    {/if}
    {#if page.route.id === '/[lang]/guide'}
      <span aria-current="page">{t.GUIDE_HEADING}</span>
    {:else}
      <a href={resolve('/[lang]/guide', { lang: data.lang })}>{t.GUIDE_HEADING}</a>
    {/if}
  </div>
  <nav class="languages">
    {#each LANGUAGES as language (language)}
      {@const code = language.toUpperCase()}
      {#if language === data.lang}
        <span lang={language} aria-current="page" data-code={code}
          ><span class="name">{LANGUAGE_NAMES[language]}</span></span
        >
      {:else}
        <a
          href={linkIn(language)}
          lang={language}
          hreflang={language}
          aria-label="{code} – {LANGUAGE_NAMES[language]}"
          data-code={code}
          data-sveltekit-reload><span class="name">{LANGUAGE_NAMES[language]}</span></a
        >
      {/if}
    {/each}
  </nav>
</header>

{@render children()}

<style>
  /* The head wraps between its parts, never within one. */
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 2rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--hairline);
  }
  .head a,
  .head span {
    white-space: nowrap;
  }
  .title {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    font-weight: 700;
    font-size: 1.0625rem;
    color: var(--text);
    text-decoration: none;
  }
  /* The mark: a bar of yes and no, and the line of a majority across it. */
  .mark {
    position: relative;
    flex: none;
    width: 1.25rem;
    height: 0.625rem;
    background: linear-gradient(to right, var(--yes-bar) 0 58%, var(--no-bar) 58% 100%);
  }
  .mark::after {
    content: '';
    position: absolute;
    left: 46%;
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: var(--text);
  }
  .entries {
    display: flex;
    gap: 1.5rem;
  }
  .languages {
    display: flex;
    gap: 1rem;
    margin-left: auto;
  }
  /* An entry and a language: a link without a line until it is pointed at, the page shown and
     its language in the text's colour above a line. */
  .entries > *,
  .languages > * {
    padding: 0.25rem 0;
  }
  .entries a,
  .languages a {
    color: var(--text-secondary);
    text-decoration: none;
  }
  .entries a:hover,
  .languages a:hover {
    color: var(--text);
    text-decoration: underline;
  }
  .entries span,
  .languages > span {
    color: var(--text);
    font-weight: 600;
    box-shadow: 0 2px 0 var(--text);
  }
  /* A narrow window: the title with the languages, written as their codes, then the entries. A
     name stays for assistive technology, in a box of one pixel. */
  @media (max-width: 639.98px) {
    .head {
      gap: 0.25rem 1.25rem;
      padding: 0.625rem 0;
    }
    .entries {
      order: 3;
      flex-basis: 100%;
      gap: 1.25rem;
    }
    .languages {
      gap: 0.75rem;
    }
    .languages > *::before {
      content: attr(data-code);
    }
    .languages .name {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
</style>
