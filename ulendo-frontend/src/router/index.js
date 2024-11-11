const pages = [
  {
    name: 'WindSolar',
    title: 'Zambian Wind and Solar',
    pages: [
      {
        name: 'WindSolarYield',
        title: 'Zambian Wind and Solar Yield',
      },
      {
        name: 'WindSolarStorageFirm',
        title: 'Zambian Wind, Solar & Storage Firm Diurnal'
      }
    ]
  },
  {
    name: 'Lumwana',
    title: 'Lumwana',
    pages:[
      {
        name: 'LumwanaSupplyDemand',
        title: 'Lumwana Supply and Demand'
      }
    ]
  }
]


const routes = [
  {
    path: '/signin',
    name: 'Signin',
    meta: {title: 'Sign in', groups:['public']},
    component: () => import(/* webpackChunkName: "signin" */ '@/system/Signin.vue'),
  }, {
    path: '/',
    name: 'Home',
    meta: {title: 'Home', groups:['public']},
    component: () => import(/* webpackChunkName: "home" */ '@/system/Home.vue'),
  }, {
    path: '/user',
    name: 'New User',
    meta: {title: 'New User'},
    component: () => import(/* webpackChunkName: "user" */ '@/system/UserForm.vue'),
  }, {
    path: '/users',
    name: 'Users',
    meta: {title: 'Users'},
    component: () => import(/* webpackChunkName: "users" */ '@/system/UsersList.vue'),
  }, {
    path: '/user/:user_id',
    name: 'User',
    meta: {title: 'User'},
    component: () => import(/* webpackChunkName: "user" */ '@/system/UserForm.vue'),
  }, {
    path: '/zambia-wind-solar',
    name: 'WindSolarYield',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "zambia-wind-solar" */ '@/pages/zambia-wind-solar/ZambiaWindSolar.vue'),
  }, {
    path: '/zambia-wind-solar-storage-firm-diurnal',
    name: 'WindSolarStorageFirm',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "zambia-wind-solar-storage-firm-diurnal" */ '@/pages/zambia-wind-solar/ZambiaWindSolarStorageFirmDiurnal.vue'),
  }, {
    path: '/lumwana-supply-demand',
    name: 'LumwanaSupplyDemand',
    meta: {groups:['barrick']},
    component: () => import(/* webpackChunkName: "lumwana-supply-demand" */ '@/pages/barrick/LumwanaSupplyDemand.vue'),
  }
]

export { pages, routes }
