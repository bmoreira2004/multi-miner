import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base precisa bater com o nome do repositório no GitHub Pages:
// https://bmoreira2004.github.io/criptor-miner-apk/
export default defineConfig({
  plugins: [react()],
  base: '/criptor-miner-apk/',
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['randomx.js'],
    esbuildOptions: { target: 'esnext' },
  },
});
