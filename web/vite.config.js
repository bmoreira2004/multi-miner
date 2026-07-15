import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// base precisa bater com o nome do repositório no GitHub Pages:
// https://bmoreira2004.github.io/criptor-miner-apk/
export default defineConfig({
  plugins: [react()],
  base: '/multi-miner/',
  resolve: {
    alias: {
      // O package.json do randomx.js só expõe a build Node via "exports",
      // mesmo tendo uma build de navegador pronta (dist/web) que usa
      // WebAssembly puro sem depender de fs/os. Forçamos a resolução
      // direta pra essa build aqui.
      'randomx.js': fileURLToPath(new URL('./node_modules/randomx.js/dist/web/index.js', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['randomx.js'],
    esbuildOptions: { target: 'esnext' },
  },
});
