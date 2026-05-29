import { defineConfig } from 'vite';
import path from 'node:path';

/**
 * Vite config for the Electron main process.
 * Filename and entry are injected by @electron-forge/plugin-vite based on
 * forge.config.ts. We only contribute aliases + externals here.
 *
 * Externals are also automatically detected by the Forge plugin from
 * package.json `dependencies`; listing them here is belt-and-braces.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'electron-store',
        'nodemailer',
        'bcryptjs',
        'electron-log',
        'electron-updater',
        'electron-squirrel-startup',
        'jsonwebtoken',
      ],
    },
  },
});
