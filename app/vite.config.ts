import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

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
      adapter: adapter(),
    }),
  ],
});
