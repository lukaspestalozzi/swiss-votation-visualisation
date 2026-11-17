<script lang="ts">
  import { resolve } from '$app/paths';
  import Redirect from '../../Redirect.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // The vote's page in each language.
  const addresses = $derived({
    de: resolve('/[lang]/votes/[id]', { lang: 'de', id: data.id }),
    fr: resolve('/[lang]/votes/[id]', { lang: 'fr', id: data.id }),
    it: resolve('/[lang]/votes/[id]', { lang: 'it', id: data.id }),
  });
</script>

<Redirect {addresses} />
