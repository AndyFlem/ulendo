
import { createApp, inject } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { registerPlugins } from '@/plugins'
import appConfig from '@/config'
import { routes, pages } from '@/router/index'

let app = null
let config = null
config = appConfig

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {

  const user = inject('user')
  const signout = inject('signout')

  document.title = to.meta.title || 'Ulendo'

  if (!to.meta || !to.meta.groups) {
    to.meta.groups = []
  }
  to.meta.groups.push('admin')
  console.log('Page groups', to.meta.groups)

  return new Promise((resolve) => {
    // If the page is not public and the user is not signed in, redirect to the signin page
    if (!to.meta.groups.includes('public') && !user.user_id) {
      signout()
      console.log('Redirecting', '/signin?to=' + to.path)
      resolve({name: 'Signin', query: {to: to.path}})
    }

    // If the user is signed in, check if they are authorised to view the page
    if (user.user_id) {
      return inject('getGroups')(user.user_id)
        .then(groups=>{
          groups.push('public')

          const intersection = to.meta.groups.filter(x => groups.includes(x))

          if (intersection.length === 0) {
            console.log('Group not authorised')
            resolve({name: 'Home'})
          }
          resolve()
        })
        .catch(err => {
          if (err.response && err.response.status === 401) {
            console.log('Server responded not authorised')
            signout()
            if (!to.meta.groups.includes('public')) {
              resolve({name: 'Signin', query: {to: to.path}})
            } else {
              resolve()
            }
          }
        })
    }

    resolve()
  })
    .then(to => {
      console.log('TO', to)
      return to ? to : true
    })
    .catch(err=>{
      console.log('Error', err)
      return false
    })
})



app = createApp(App)
app.config.globalProperties.$config = config
app.use(router)
registerPlugins(app, {router, config})
app.mount('#app')

