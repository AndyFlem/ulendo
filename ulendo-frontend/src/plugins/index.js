/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import { loadFonts } from './webfontloader'
import vuetify from './vuetify'
import axiosPlugin from './axiosplugin'
import user from './user'
import common from './common'


export function registerPlugins (app, options) {
  loadFonts()
  app
    .use(vuetify)
    .use(axiosPlugin, options)
    .use(user)
    .use(common)
}
