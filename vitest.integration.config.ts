import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

/**
 * Integration test runner. Reaches out to the real Supabase project defined
 * in .env.local — do NOT run in CI without a dedicated test project. Slower,
 * so it's kept separate from the fast Vitest suite (pnpm test).
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(rootDir, 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    pool: 'forks',
  },
})
