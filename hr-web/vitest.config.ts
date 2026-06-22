import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    pool: 'forks',
    // PGlite spins up a fresh embedded Postgres (WASM) per test; under full
    // parallelism the setup hook needs headroom, and capping forks reduces
    // simultaneous WASM compiles so each instance starts faster.
    testTimeout: 30000,
    hookTimeout: 60000,
    // Each test file gets its own fork that is torn down before the next runs,
    // so the heavy PGlite WASM instance is released between files. Running them
    // concurrently (the old maxForks:4) OOM-kills low-memory machines.
    fileParallelism: false,
    isolate: true,
    maxWorkers: 1,
    execArgv: ['--max-old-space-size=1536'],
  },
});
