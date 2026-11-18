<script lang="ts">
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { ResultShown } from '../../../../lib/vote-page.ts';

  // The selection's result at the bottom of a narrow window (spec small-screens; design of
  // add-small-screens, decisions 1 and 2): while a selection applies and its box "Mit Ihrer
  // Auswahl" does not lie wholly within the window, the outcome and the words of both majorities.
  // It repeats the box, which assistive technology reads in its place.
  let {
    t,
    selection,
    box,
  }: {
    t: Texts;
    // The selection's result, or null while no selection applies.
    selection: ResultShown | null;
    // The box "Mit Ihrer Auswahl", while it is on the page.
    box: HTMLElement | null;
  } = $props();

  // Whether the box lies wholly within the window.
  let whole = $state(false);
  $effect(() => {
    if (box === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        whole = entries.every((entry) => entry.intersectionRatio >= 0.999);
      },
      { threshold: [0.999] },
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  });

  const lines = $derived(
    selection === null
      ? null
      : t.selectionBar(
          selection.outcome,
          selection.verdicts[0].verdict,
          selection.verdicts[1].verdict,
        ),
  );
</script>

{#if lines !== null && !whole}
  <div class="selection-bar" aria-hidden="true">
    <p class="outcome">{lines[0]}</p>
    <p>{lines[1]}</p>
  </div>
{/if}

<style>
  /* It sticks to the bottom of the window while the page scrolls, and at the end of the page it
     stands in its own place, below the last line, so that it hides nothing. From 640 pixels the
     box stands beside the vote's result, and there is no bar. */
  .selection-bar {
    position: sticky;
    bottom: 0;
    z-index: 1;
    padding: 0.25rem 0.5rem;
    border-top: 1px solid;
    background: #ffffff;
  }
  @media (min-width: 640px) {
    .selection-bar {
      display: none;
    }
  }
  p {
    margin: 0;
  }
  .outcome {
    font-weight: bold;
  }
</style>
