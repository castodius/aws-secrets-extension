import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Construct } from 'constructs'
import { buildSync } from 'esbuild'
import { Code, LayerVersion } from 'aws-cdk-lib/aws-lambda'

const __dirname = dirname(fileURLToPath(import.meta.url))

export class AwsSecretsExtension extends LayerVersion {

  constructor(scope: Construct, id: string) {
    buildSync({
      bundle: true,
      treeShaking: true,
      minify: true,
      target: 'node20',
      format: 'esm',
      legalComments: 'none',
      metafile: true,
      entryPoints: [
        join(__dirname, './extension/index.js')
      ],
      outdir: '.dist/extensions',
      platform: 'node',
      banner: {
        'js': '#!/usr/bin/env node\nimport { createRequire } from "module"; const require = createRequire(import.meta.url);',
      },
      external: [],
      outExtension: {
        '.js': '.mjs',
      },
      sourcesContent: false,
      mainFields: [
        'module',
        'main'
      ],
    })

    super(scope, id, {
      code: Code.fromAsset('.dist'),
    })
  }
}
