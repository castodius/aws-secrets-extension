// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      include: [
        'lib/extension/env.ts',
        'lib/extension/logging.ts',
        'lib/extension/cache.ts',
        'lib/extension/errors.ts',
        'lib/extension/validation.ts',
        'lib/extension/region.ts'
      ],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
})
