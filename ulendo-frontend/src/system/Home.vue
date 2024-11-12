<script setup>
  import { inject, computed } from 'vue'
  import { routes, pageGroups } from '@/router'
  const user=inject('user')

  const groups = computed(() => {
    let ret = {}

    pageGroups.map(group=>{
      group.pages.forEach(p=>{
        p.route = routes.find(r=>r.name==p.name)
        const pageGroups = p.route.meta.groups
        pageGroups.push('admin')
        const intersection = pageGroups.filter(x => user.groups.includes(x))

        if (intersection.length>0) {
          p.thumb = new URL(`/src/assets/page_thumbs/${p.name}.jpg`, import.meta.url).href
          if (!intersection.includes('public')) {
            p.secure = true
          }
          if (!ret[group.name]) {
            ret[group.name] = group
            ret[group.name].pages = []
          }
          ret[group.name].pages.push(p)
        }
      })
    })
    return ret
  })

</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col v-for="group in groups" :key="group.name" class="" cols="12">
        <v-card class="elevation-0">
          <v-card-text>
            <v-row>
              <v-col cols="12" class="text-h6 text-sm-h5 text-md-h4">
                {{ group.title }}
              </v-col>
              <v-col v-for="page in group.pages" :key="page.name" class="" cols="12">
                <v-card>
                  <v-card-title>
                    <router-link style="text-decoration: none; color: inherit;" :to="page.route.path">
                    <v-row class="align-center" no-gutters>

                      <v-col class="" cols="12" sm="4" md="2">
                        <img height="100" :src="page.thumb"/>
                      </v-col>
                      <v-col cols="12" sm="8" md="10">

                        <span class="text-wrap  text-subtitle-2 text-sm-h6 text-md-h5">{{ page.title }} </span>
                        <v-icon v-if="page.secure" icon="mdi-lock" size="x-small" class="mb-5"/>
                      </v-col>

                      </v-row>
                    </router-link>
                  </v-card-title>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>
