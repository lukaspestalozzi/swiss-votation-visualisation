import { defineConfig } from '@playwright/test';

// The tests run against the built site (`pnpm run build`), served as plain files.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'sirv build --port 4173', port: 4173 },
});
