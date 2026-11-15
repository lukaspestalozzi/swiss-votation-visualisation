import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// The path of the site's address, https://lukaspestalozzi.github.io/swiss-votation-visualisation/
// (spec publishing). The site is built for this path only, and written into a directory of the
// same name, so that `app/build` has the shape of the address: `sirv build` serves it under the
// path for the browser tests, and CI publishes `app/build/swiss-votation-visualisation`.
const path = '/swiss-votation-visualisation';

export default defineConfig({
  // The unit tests only: the browser tests in e2e/ belong to Playwright.
  test: { include: ['src/**/*.test.ts'] },
  plugins: [
    sveltekit({
      compilerOptions: {
        // Runes mode for the project's own files; a dependency decides for itself.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      adapter: adapter({ pages: `build${path}`, assets: `build${path}` }),
      // Absolute paths (`/swiss-votation-visualisation/_app/...`), not relative to the page: a
      // page opened without its final slash (`/votes/5960`) still finds its scripts and styles.
      paths: { base: path, relative: false },
    }),
  ],
});
