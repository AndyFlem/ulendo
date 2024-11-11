<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import * as d3 from 'd3'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const makeTrans = inject('makeTrans')
  //const months = inject('months')

  import lumwanaDemand from '@/data/barrick/output/lumwanaDemand.csv'
console.log(lumwanaDemand[0])

  const chartLumwanaDemand = computed(() => {

    var data = [
      {
        x: lumwanaDemand.map(v=>v.year),
        y: lumwanaDemand.map(v=>v.demandMW),
        type: 'bar', showlegend:false, name: '',
        marker: {shape: 'spline',width:1.5, color: makeTrans(colors.demand[5],0.6)}
      },{
        x: [2023,2042],yaxis:'y2',showlegend:false,
        y: [d3.max(lumwanaDemand,v=>v.annualEnergyGWh/12),d3.max(lumwanaDemand,v=>v.annualEnergyGWh/12)],
        text: ['',d3.format(',.0f')(d3.max(lumwanaDemand,v=>v.annualEnergyGWh/12))+'GWh/month'],
        textposition:'top', hoverinfo:'none',
        line: {width:0.5}, mode:'lines+text'
      }]

    var layout = {
      height: 260,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 70,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
      },
      yaxis: {
        title: 'MW',
        range: [0, d3.max(lumwanaDemand,v=>v.demandMW)*1.1],
        showgrid: true, zeroline: false, tickformat: ',.0f', ticks:'outside',
      },
      yaxis2: {
        showgrid: false,zeroline: false,
        showline: false,title: 'GWh/month',
        tickformat: ',.0f', ticks:'outside',
        range:[0,d3.max(lumwanaDemand,v=>v.demandMW)*1.1*8/12],
        overlaying: 'y',side: 'right'
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  })
</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        <h1>Lumwana</h1>

      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartLumwanaDemand" />
          <figcaption>
          A
        </figcaption>
        </v-sheet>
      </v-col>
    </v-row>
  </PresentationPage>
</template>
