<script setup>
  import {  inject } from 'vue'
  import { useDisplay } from 'vuetify'
  // import { min, max } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  // const makeTrans = inject('makeTrans')
  // const months = inject('months')

  import iluteAnnualExceedance from '@/data/ilute/output/iluteAnnualExceedance.csv'
  import iluteStatistics_raw from '@/data/ilute/output/iluteStatistics.csv'
  const iluteStatistics = iluteStatistics_raw[0]


  function chartRelativeAnnualYieldExceedance() {
    var data = [
      {
        x: iluteAnnualExceedance.map(v => v.exceedance),
        y: iluteAnnualExceedance.map(v => v.normalisedYearlySpecificYield),
        type: 'scatter', showlegend:true, hoverinfo:'x+y',name:'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.solar[1]}
      },{
        x: [1,0],
        y: [1,1],
        type: 'scatter', showlegend:false, hoverinfo:'none',
        mode:'lines', line: {width:1, color: '#000'}
      }]

    var layout = {
      height: 350,
      showlegend: true, legend: {xanchor: 'left', x:0, y: 1, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font: font,
      xaxis: {
        showgrid: false, dtick:0.1,
        zeroline: false, tickformat:'.0%', range: [1,-0.02],
        ticks:'outside', title: 'Exceedance Probability'
      },
      yaxis: {
        title: '% difference from median',  dtick:0.02,
        showgrid: true, zeroline: false, tickformat: ',.0%', ticks:'outside',
      },
      yaxis2: {
        showgrid: false,zeroline: false,
        showline: false,title: 'Specific Yield GWh/MW/year',
        tickformat: ',.2f',
        overlaying: 'y',side: 'right'
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartAnnualYieldExceedance() {
    var data = [
      {
        x: iluteAnnualExceedance.map(v => v.exceedance),
        y: iluteAnnualExceedance.map(v => v.yearlySpecificYield/1000),
        type: 'scatter', showlegend:true, hoverinfo:'x+y',name: 'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.solar[1]}
      },{
        text: [format(',.2f')(iluteStatistics.medianAnualSpecificYield/1000) + ' GWh/MW/year'],
        x: [0.5],
        y: [iluteStatistics.medianAnualSpecificYield/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      }]

    var layout = {
      height: 350,
      showlegend: true, legend: {xanchor: 'left', x:0, y: 1, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
      xaxis: {
        showgrid: false, dtick:0.1,
        zeroline: false, tickformat:'.0%', range: [1,-0.02],
        ticks:'outside', title: 'Exceedance Probability'
      },
      yaxis: {
        showgrid: true,zeroline: false,
        showline: false,title: 'Annual Energy GWh/MW/year',
        tickformat: ',.2f',

      }
    }

    return {data, layout , config: {displayModeBar: false}}

  }


</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        <h1>Ilute I Solar PV Project - Yield Analysis</h1>

      </v-col>
      <v-col>
        <h2>Annual Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartRelativeAnnualYieldExceedance()" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartAnnualYieldExceedance()" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col>
        <h2>Monthly Yield</h2>
      </v-col>
      <v-col>
        <h2>Daily Yield</h2>
      </v-col>

    </v-row>
  </PresentationPage>
</template>
