const pageGroups = [
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
        title: 'Zambian Wind, Solar & Storage Combinations for a Firm Diurnal'
      }
    ]
  },
  {
    name: 'SAPP',
    title: 'SAPP',
    pages:[
      {
        name: 'SAPP_DAM',
        title: 'SAPP Day Ahead Market'
      },
      {
        name: 'SolarBenchmark',
        title: 'SAPP Solar Benchmark Price'
      },
      {
        name: 'WindBenchmark',
        title: 'SAPP Wind Benchmark Price'
      }
    ]
  }, {
    name: 'Lumwana',
    title: 'Lumwana Supply and Demand',
    pages:[
      {
        name: 'LumwanaSupplyDemand',
        title: 'Lumwana Mine Energy Supply and Demand Balance'
      }
    ]
  }, {
    name: 'Ilute',
    title: 'Ilute Solar PV',
    pages:[
      {
        name: 'IluteYield',
        title: 'Ilute PV Project - Yield Statistics'
      },
      {
        name: 'IluteGreenCo',
        title: 'Ilute PV Project - GreenCo PPA'
      }
    ]
  }, {
    name: 'Unika',
    title: 'Unika II Wind',
    pages:[
      {
        name: 'UnikaYield',
        title: 'Unika II Wind Project - Yield Statistics'
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
  }, {
    path: '/sapp/dam',
    name: 'SAPP_DAM',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "sapp-dam" */ '@/pages/sapp/DAM.vue'),
  }, {
    path: '/sapp/solar-benchmark',
    name: 'SolarBenchmark',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "sapp-solar-benchmark" */ '@/pages/sapp/SolarBenchmark.vue'),
  }, {
    path: '/sapp/wind-benchmark',
    name: 'WindBenchmark',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "sapp-wind-benchmark" */ '@/pages/sapp/WindBenchmark.vue'),
  }, {
    path: '/ilute/yield',
    name: 'IluteYield',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "ilute-yield" */ '@/pages/ilute/IluteYield.vue'),
  }, {
    path: '/ilute/greenco',
    name: 'IluteGreenCo',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "ilute-greenco" */ '@/pages/ilute/IluteGreenCo.vue'),
  }, {
    path: '/unika/yield',
    name: 'UnikaYield',
    meta: {groups:['public']},
    component: () => import(/* webpackChunkName: "unika-yield" */ '@/pages/unika/UnikaYield.vue'),
  }
]

export { pageGroups, routes }
