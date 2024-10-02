import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.ts'], },
  {
    ignores: ['dist/*', 'coverage/*', 'node_modules/*'],
  },
  {
    rules: {
      'comma-dangle': ['error', {
        'objects': 'always',
      }],
      semi: ['error', 'never'],
    },
  },
  { languageOptions: { globals: globals.browser, }, },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended
]
