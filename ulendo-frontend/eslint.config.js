import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from "globals";

export default [
  {
    languageOptions: {
      globals: {...globals.browser, ...globals.node},
    }
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]
