import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import type { Theme } from '../src/contexts/ThemeContext';
import '../src/styles/index.css';

// storySort.order must be an inline array literal — Storybook's static
// story-index extractor parses this file's AST without executing it, so a
// reference to an external const fails silently (falls back to
// alphabetical ordering). Keep this list in sync with docs/SPEC.md's
// "Component Inventory" category order.
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          'Typography',
          'Buttons',
          'Inputs',
          'Form',
          'Navigation',
          'Data Display',
          'Board',
          'Canvas',
          'Feedback',
          'Overlays',
          'Media',
          'Utilities',
          'Mobile',
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Design system theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'high-contrast', title: 'High contrast' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Writing direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as Theme | undefined) ?? 'light';
      const direction = (context.globals.direction as 'ltr' | 'rtl' | undefined) ?? 'ltr';
      return (
        <ThemeProvider key={theme} defaultTheme={theme}>
          <div dir={direction}>
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
