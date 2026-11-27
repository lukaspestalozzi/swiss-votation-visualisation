<script lang="ts">
  import type { Summary } from '../../../../lib/vote-page.ts';

  // A vote's summary and, below it, the link to its day's explanations of the Federal Council
  // (spec vote-summaries; design of add-vote-summaries, decision 6), on a vote's page and on the
  // comparison. The link leaves the site, to the Confederation's or Swissvotes' server.
  let { summary }: { summary: Summary } = $props();
</script>

<div class="summary">
  <p>{summary.text}</p>
  <p class="explanations"><a href={summary.href} rel="external">{summary.label}</a></p>
</div>

<style>
  .summary p {
    margin: 0.5rem 0 0;
  }
  /* On a touch screen the link is at least 44 pixels high (spec small-screens). */
  @media (pointer: coarse) {
    .explanations a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  }
</style>
