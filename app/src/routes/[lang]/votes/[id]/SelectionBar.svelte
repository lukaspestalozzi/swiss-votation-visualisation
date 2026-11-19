<script lang="ts">
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { ResultShown, Side } from '../../../../lib/vote-page.ts';

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

  // Whether the box lies wholly within the window; null until the observer has said so for this
  // box, so that the bar does not show for the frame before it reports a box in view.
  let whole = $state<boolean | null>(null);
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
      whole = null;
    };
  });

  // Each verdict's word in the map's colour of its side, as in the box (spec site-style, "The
  // verdicts in the map's colours").
  const sideClass = (side: Side) => (side === null ? undefined : `side-${side}`);
</script>

{#if selection !== null && whole === false}
  {@const [voters, cantons] = selection.verdicts}
  <div class="selection-bar" aria-hidden="true">
    <p class="outcome">
      {t.WITH_SELECTION}:
      <span class={sideClass(selection.outcomeSide)}>{selection.outcome}</span>
    </p>
    <p>
      {t.MAJORITY_OF_VOTERS}: <span class={sideClass(voters.side)}>{voters.verdict}</span> ·
      {t.MAJORITY_OF_CANTONS}: <span class={sideClass(cantons.side)}>{cantons.verdict}</span>
    </p>
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
    background: var(--ground);
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
