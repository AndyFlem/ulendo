<script setup>
  import { routes, pages } from '@/router'

  console.log(routes)
  const cats = pages.map(cat=>{
    cat.pages.map(p=>{
      const route = routes.find(r=>r.name==p.name)
      if(route) {
        p.route = route
      }
      p.thumb = new URL(`/src/assets/page_thumbs/${p.name}.jpg`, import.meta.url).href
      return p
    })
    return cat
  })
  console.log(cats)
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col v-for="cat in cats" :key="cat.name" class="" cols="12">
        <v-card class="elevation-0">
          <v-card-text>
            <v-row>
              <v-col cols="12" class="text-h6 text-sm-h5 text-md-h4">
                {{ cat.title }}
              </v-col>
              <v-col v-for="page in cat.pages" :key="page.name" class="" cols="12">
                <v-card>
                  <v-card-title>
                    <router-link style="text-decoration: none; color: inherit;" :to="page.route.path">
                    <v-row class="align-center" no-gutters>

                      <v-col class="" cols="12" sm="4" md="2">
                        <img height="100" :src="page.thumb"/>
                      </v-col>
                      <v-col cols="12" sm="8" md="10" class="text-wrap  text-subtitle-2 text-sm-h6 text-md-h5">
                        {{ page.title }}
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
