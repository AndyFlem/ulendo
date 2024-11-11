// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

import { DateTime } from 'luxon'
import dsv from '@rollup/plugin-dsv'

export default defineConfig({
  plugins: [
    dsv({

      processRow: (row, id) => {
        Object.keys(row).forEach((key) => {
          var value = row[key]
          if (isNaN(+value)) {
            //row[key] = isNaN(+value) ? value : +value
            if (DateTime.fromISO(value).isValid) {
              row[key] = DateTime.fromISO(value).toJSDate()
            }
          } else {
            row[key] = +value
          }

        })
      }
    }),
    vue({
      template: { transformAssetUrls }
    }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 4000,
  },
})
