<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDate } from '../../../../lib/format.ts';
  import type { VoteEntries } from '../../../../lib/result-map.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { MapFile } from '../../../../lib/vote-data.ts';
  import { loadMap } from './loaders.ts';

  // The lines below the map and its legend (spec result-map, "The source of the map" and "The
  // Swiss abroad"), once the map has loaded: its source, and the Swiss abroad, who are not on it.
  // They are apart from the map so that they scroll with the page while the map stays in the
  // window (design of redesign-site, decision 8). The map's files are loaded once per visit: this
  // asks for what the map asked for.
  let { t, entries }: { t: Texts; entries: VoteEntries } = $props();

  let map = $state.raw<MapFile | null>(null);
  onMount(() => {
    loadMap().then(
      (loaded) => {
        map = loaded.map;
      },
      // The map says that it cannot be loaded; without it these lines say nothing.
      () => undefined,
    );
  });

  // The entries of Swiss abroad, which are not on the map.
  const swissAbroad = $derived(entries.cantons.filter((canton) => canton.abroad !== null).length);
</script>

{#if map !== null}
  <p class="source secondary">{t.mapSource(formatDate(map.referenceDate, t), map.lakesSet)}</p>
  {#if swissAbroad > 0}
    <p>{t.swissAbroadNotOnTheMap(swissAbroad)}</p>
  {/if}
{/if}
