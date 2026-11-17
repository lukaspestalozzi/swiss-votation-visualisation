import { defineConfig } from '@playwright/test';

// The tests run against the built site (`pnpm run build`), served as plain files under the path
// it is published at (`app/vite.config.ts`). The tests open pages by paths relative to this base
// URL (`votes/5960`): an absolute path (`/votes/5960`) would leave the site's path.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  // One test at a time (spec result-map; design of steady-budget-tests, decision 1): a test
  // running beside a budget test lengthens its frames by 2 to 4 ms (investigations/performance.md).
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/swiss-votation-visualisation/' },
  webServer: { command: 'sirv build --port 4173', port: 4173 },
});
