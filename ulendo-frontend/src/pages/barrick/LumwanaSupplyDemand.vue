<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import {  max } from 'd3-array'
  //import { groups, min, max, mean, sum } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const makeTrans = inject('makeTrans')
  //const months = inject('months')

  import lumwanaDemand from '@/data/barrick/output/lumwanaDemand.csv'
  import parameters from '@/data/barrick/output/parameters.json'


  const chartLumwanaDemand = computed(() => {

    var data = [
      {
        x: lumwanaDemand.map(v=>v.year),
        text: lumwanaDemand.map(v=>format(',.0f')(v.demandMW)+'MW'),
        y: lumwanaDemand.map(v=>v.demandMW), hoverinfo: 'text',
        type: 'bar', showlegend:false, name: 'Demand', textposition: 'none',
        marker: {shape: 'spline',width:1.5, color: makeTrans(colors.demand[5],0.6)}
      },{
        x: [2023,2042],yaxis:'y2',showlegend:false,
        y: [max(lumwanaDemand,v=>v.annualEnergyGWh/12),max(lumwanaDemand,v=>v.annualEnergyGWh/12)],
        text: ['',format(',.0f')(max(lumwanaDemand,v=>v.annualEnergyGWh/12))+'GWh/month'],
        textposition:'top', hoverinfo:'none',
        line: {width:0.5}, mode:'lines+text'
      }]

    var layout = {
      height: 270,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 70,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
      },
      yaxis: {
        title: 'MW',
        range: [0, max(lumwanaDemand,v=>v.demandMW)*1.1],
        showgrid: true, zeroline: false, tickformat: ',.0f', ticks:'outside',
      },
      yaxis2: {
        showgrid: false,zeroline: false,
        showline: false,title: 'GWh/month',
        tickformat: ',.0f', ticks:'outside',
        range:[0,max(lumwanaDemand,v=>v.demandMW)*1.1*8/12],
        overlaying: 'y',side: 'right'
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  })

  /*
  const chartCombinedAnnual = computed(() => {
    let cap='.'

    var data = [
      {
        x: combinedYearly.map(v=>v.date.toJSDate()),
        y: combinedYearly.map(v=>v.solar.yearlyEnergyMWh/1000),
        type: 'bar', showlegend:true, name: 'Solar yield',
        marker: {color: makeTrans(colors.solar[1],0.6)}
      },{
        x: combinedYearly.map(v=>v.date.toJSDate()),
        y: combinedYearly.map(v=>v.wind.yearlyEnergyMWh/1000),
        type: 'bar', showlegend:true, name: 'Wind yield',
        marker: {color: makeTrans(colors.wind[1],0.6)}
      },{
        x: combinedYearly.map(v=>v.date.toJSDate()),
        y: combinedYearly.map(v=>v.yearlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '',
        line: {shape:'spline', width:1.5, color: makeTrans(colors.combined[1],1)}
      },
      demand(19,''),
      demand(12,'dash'),
      demand(8, 'dot'),
      demand(5, 'dashdot'),
      demand(2, 'dash')]

  function demand(yearNo, dash) {
    return {
        x:['2002-01-01','2021-12-31'], textposition:'left',
        y:[lumwanaDemand[yearNo].annualEnergyGWh,lumwanaDemand[yearNo].annualEnergyGWh],showlegend:false,
        text: [lumwanaDemand[yearNo].year,''],hoverinfo:'y',
        mode:'lines+text', name:'Demand ' + lumwanaDemand[yearNo].year, line:{color: colors.demand[7], width:1.5, dash:dash}
      }
  }

    var layout = {
      height: 350, width: width>1100?1070:width-30, barmode:'stack',
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 70,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,zeroline: false, ticks:'outside',
      },
      yaxis: {
        title: 'GWh',
        showgrid: true, zeroline: false, tickformat: ',.0f', ticks:'outside',
      }
    }

    const div=container(cap, width>1100?1090:width-10)
    plt.newPlot(div, data, layout,{displayModeBar: false})
    return div
  })
  */
</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col>
        <v-row no-gutters>
          <v-col cols="12" sm="4" md="2">
            <v-img src="/mphepo-logo.png" alt="Mphepo" class="mt-1" style="height: 50px;" />
          </v-col>
          <v-col cols="12" sm="8" md="10">
            <span class="text-h4 text-sm-h3 text-md-h2">Lumwana Mine Energy Supply and Demand Balance</span>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
         Energy demand at the Barrick Gold Lumwana Mine is forecast to rise significantly with the expansion of the mine over the next 10 to 20 years.
         The mine consumes approximately 40 GWh per month in 2023 which is expected to rise to 90 GWh
         per month by 2028, 100 GWh per month by 2031 and 120 GWh per month by 2042.
         <br><br>
         Zambia is currently experiencing a significant power deficit due to structural shortages of power generation capacity and, in 2024-2025 drought
         impacting hydropower production. Although new power generation projects are being developed,
         the power supply situation is expected to remain tight for the foreseeable future.
         To secure its energy supply, the mine is considering entering into a long-term power purchase agreement with
         new renewable power generation projects in Zambia based on Solar PV and Wind power.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartLumwanaDemand" />
          <figcaption>
          Lumwana mine forecasted power demand in MW and energy consumption in GWh/month based on 8,000hrs/year of operation.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        Demand from large industrial customers such as mines is consistent and predictable over all timescales - from low hourly,
        through daily (diurnal) and up to annual, seasonal variations. In contrast,
        <router-link :to="{name: 'WindSolarYield'}">generation from renewable sources such as
          wind and solar is variable and intermittent </router-link>(dependent on weather conditions).
        <br><br>
        The challenge is to match the supply of renewable energy with the industrial demand and whilst, in Zambia,
        <router-link  :to="{name: 'WindSolarStorageFirm'}">certain combinations of renewable energy
        sources can be complementary</router-link>, medium and long-term smoothing and balancing services - either from
        the utility or the regional power market - are required to ensure a consistent supply.
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Unika II Wind</span>
      </v-col>
      <v-col cols="12">
        The Mphepo Power - Unika II Wind Project is a {{ parameters.capacityWindMW }}MW grid connected wind farm that will be constructed in the
        Katete District of Eastern Province, Zambia.
        Installation of the 19 wind turbines 6.5MW is expected to commence in 2027 and be completed by the end of 2028.
        <br><br>
        The project is expected to generate approximately GWh of electricity per year.
      </v-col>
    </v-row>
  </PresentationPage>
</template>
