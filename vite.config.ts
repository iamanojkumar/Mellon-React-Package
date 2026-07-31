import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Consumers bring their own React; keeps the library tree-shakeable
      // and avoids duplicate React copies / invalid hook call errors.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    sourcemap: true,
    // All component styles bundle into a single dist/style.css that
    // consumers import explicitly (see package.json "./styles.css" export).
    cssCodeSplit: false,
  },
});
