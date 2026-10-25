import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'konjugator' },
    rolldownOptions: { external: ['phaser'] },
  },
});
