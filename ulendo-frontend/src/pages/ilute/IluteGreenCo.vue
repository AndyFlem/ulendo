<script setup>
  //import {  inject } from 'vue'
  import { useDisplay } from 'vuetify'
  //import { format } from 'd3-format'
  //import { groups } from 'd3-array'

  //import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  //const colors = inject('colors')
  //const font = inject('font')
  //const months = inject('months')
  //const makeTrans = inject('makeTrans')


</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        <h1>Ilute I Solar PV Project - GreenCo PPA Model</h1>

      </v-col>
    </v-row>
  </PresentationPage>
</template>
