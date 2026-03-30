import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

const projectRoot = __dirname;

export default defineConfig({
  root: path.join(projectRoot, 'src/renderer'),
  envDir: projectRoot,
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: path.join(projectRoot, 'src/main/index.ts'),
        onstart({ startup }) {
          startup();
        },
        vite: {
          build: {
            outDir: path.join(projectRoot, 'dist/main'),
            rollupOptions: {
              external: ['electron', 'better-sqlite3'],
            },
          },
          resolve: {
            alias: {
              '@shared': path.join(projectRoot, 'src/shared'),
              '@main': path.join(projectRoot, 'src/main'),
            },
          },
        },
      },
      {
        // Preload script entry
        entry: path.join(projectRoot, 'src/preload/index.ts'),
        onstart({ reload }) {
          reload();
        },
        vite: {
          build: {
            outDir: path.join(projectRoot, 'dist/preload'),
            rollupOptions: {
              external: ['electron'],
            },
          },
          resolve: {
            alias: {
              '@shared': path.join(projectRoot, 'src/shared'),
            },
          },
        },
      },
    ]),
    electronRenderer(),
  ],
  resolve: {
    alias: {
      '@shared': path.join(projectRoot, 'src/shared'),
      '@renderer': path.join(projectRoot, 'src/renderer'),
    },
  },
  build: {
    outDir: path.join(projectRoot, 'dist/renderer'),
  },
});
