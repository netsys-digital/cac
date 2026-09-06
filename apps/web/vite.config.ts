import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5178,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3003',
      '/health': 'http://localhost:3003',
      '/ready': 'http://localhost:3003',
    },
  },
});
