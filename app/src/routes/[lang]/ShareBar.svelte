<script lang="ts">
  // A bar of a share (spec verdicts, "The bars of a result"; design of redesign-site, decisions
  // 11 and 14): the yes part from the left, as wide as the share, the no part the rest, and a
  // mark at half. Without a share it is empty. A bar that judges nothing takes no side's colour.
  // It draws what the figures beside it say, so assistive technology passes it over. Its look is
  // `app.css`'s, which the bar of the cantons shares.
  let {
    percent,
    neutral = false,
  }: {
    // The share in percent, or null where there is none.
    percent: number | null;
    // Whether the bar shows something that is not judged: a tie-break question's two shares.
    neutral?: boolean;
  } = $props();
</script>

<div class="bar" class:neutral aria-hidden="true">
  {#if percent !== null}
    <span class="yes" style:width="{percent}%"></span><span class="no"></span>
  {/if}
  <span class="half"></span>
</div>
