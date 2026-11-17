<script lang="ts">
  import { resolve } from '$app/paths';
  import Redirect from './Redirect.svelte';

  // The start page in each language.
  const addresses = {
    de: resolve('/[lang]', { lang: 'de' }),
    fr: resolve('/[lang]', { lang: 'fr' }),
    it: resolve('/[lang]', { lang: 'it' }),
  };
</script>

<Redirect {addresses} />
