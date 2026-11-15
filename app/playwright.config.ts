import { defineConfig } from '@playwright/test';

// The tests run against the built site (`pnpm run build`), served as plain files under the path
// it is published at (`app/vite.config.ts`). The tests open pages by paths relative to this base
// URL (`votes/5960`): an absolute path (`/votes/5960`) would leave the site's path.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/swiss-votation-visualisation/' },
  webServer: { command: 'sirv build --port 4173', port: 4173 },
});
