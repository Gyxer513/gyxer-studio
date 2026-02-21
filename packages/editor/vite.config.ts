import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@gyxer/schema': path.resolve(__dirname, '../schema/src'),
      '@gyxer/generator': path.resolve(__dirname, '../generator/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
