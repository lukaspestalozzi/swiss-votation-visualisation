import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// The path of the site's address, https://lukaspestalozzi.github.io/swiss-votation-visualisation/
// (spec publishing). The site is built for this path only, and written into a directory of the
// same name, so that `app/build` has the shape of the address: `sirv build` serves it under the
// path for the browser tests, and CI publishes `app/build/swiss-votation-visualisation`.
const path = '/swiss-votation-visualisation';

// Vite reads this file under Node, but the app has no Node types (it runs in the browser): the one
// global it uses is declared here, for this file only.
declare const process: { env: Record<string, string | undefined> };

// The preview of a branch (`PREVIEW=1`, set by scripts/preview.mjs; CLAUDE.md, "The preview"):
// relative addresses, so that the site runs below any address, as in a Claude Artifact, written
// to `build/preview`. Without it the build is the live site's. A variable of the environment, not
// Vite's mode: SvelteKit loads this file again for its own builds, in the mode `production`.
const preview = process.env.PREVIEW === '1';

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
      adapter: preview
        ? adapter({ pages: 'build/preview', assets: 'build/preview' })
        : adapter({ pages: `build${path}`, assets: `build${path}` }),
      // Absolute paths (`/swiss-votation-visualisation/_app/...`), not relative to the page: a
      // page opened without its final slash (`/votes/5960`) still finds its scripts and styles.
      paths: preview ? { base: '', relative: true } : { base: path, relative: false },
    }),
  ],
});
