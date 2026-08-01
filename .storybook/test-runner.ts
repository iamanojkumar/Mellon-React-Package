import { checkA11y, injectAxe } from 'axe-playwright';
import type { TestRunnerConfig } from '@storybook/test-runner';

// Runs axe-core against every story via a real browser (chromium, through
// Playwright) — this is the actual CI enforcement `a11y.test: 'error'` in
// preview.tsx sets the intent for; that parameter only controls the addon
// panel's display in interactive `pnpm dev`, so this file is what makes
// `pnpm test:storybook` fail the build on a real violation.
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: {
        rules: {
          // Same jsdom-vs-real-browser tradeoff does NOT apply here (this
          // runs in a real chromium), so contrast checks stay enabled,
          // unlike tests/axe.ts's jsdom-based unit tests.
        },
      },
    });
  },
};

export default config;
