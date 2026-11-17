<script lang="ts">
  import { resolve } from '$app/paths';
  import Redirect from '../Redirect.svelte';

  // The guide in each language.
  const addresses = {
    de: resolve('/[lang]/guide', { lang: 'de' }),
    fr: resolve('/[lang]/guide', { lang: 'fr' }),
    it: resolve('/[lang]/guide', { lang: 'it' }),
  };
</script>

<Redirect {addresses} />
