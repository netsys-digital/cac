import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  envDir: monorepoRoot,
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5178,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3003',
      '/uploads': 'http://localhost:3003',
      '/health': 'http://localhost:3003',
      '/ready': 'http://localhost:3003',
    },
  },
});
