<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  //import { DateTime } from 'luxon'
  import { min, max } from 'd3-array'
  //import { groups, min, max, mean, sum } from 'd3-array'
  //import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  //const makeTrans = inject('makeTrans')
  //const months = inject('months')

  import damMonthly from '@/data/sapp/output/dam/dam_monthly.csv'
  //import damYealry from '@/data/sapp/output/dam/dam_yearly.csv'
  import monthlySolarBenchmark from '@/data/sapp_benchmarks/output/monthlySolarBenchmarkPrice.csv'

  const chartSolarBenchmark = computed(() => {
    var data = [
      {
        y: monthlySolarBenchmark.map(d=>d.priceMean),
        x: monthlySolarBenchmark.map(d=>d.date),
        mode: 'lines+markers', line: {shape: '', color: colors.solar[1], width: 1.5},
        type: 'scatter', showlegend:true, fill:'tozeroy',  name:'Solar Benchmark Price',
        hovertemplate: "<b>%{x}</b><br>" +
          "%{y:,.0f} %{yaxis.title.text}" +
          "<extra></extra>",
      }
    ]

    data.push({
      y: damMonthly.map(m=>m.priceMean),
      x: damMonthly.map(m=>m.datetime),
      mode: 'lines+markers', line: {shape: '', color: '#444', width: 1}, marker:{size:2},
      type: 'scatter', showlegend:true, fill:'', name:'SAPP DAM Average Price',
      hovertemplate: "<b>%{x}</b><br>" +
        "%{y:,.0f} %{yaxis.title.text}" +
        "<extra></extra>",
    })


    var layout = {
      height: 300,
      font: font,
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1},
      margin: {l: 70,r: 5,b: 30,t: 0},
      xaxis: {
        showgrid: true, zeroline: false, ticks: 'outside',
        range:[min(monthlySolarBenchmark, d=>d.date),max(monthlySolarBenchmark, d=>d.date)]
      },
      yaxis: {
        range: [20,230],
        title: `$/MWh`,
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  })

  /*
  const chartDAMonthlyAnnualPrice = computed(() => {
    var data = []


    data.push({
      y: damYealry.map(m=>m.priceMinP10),
      x: damYealry.map(m=>DateTime.fromObject({year: m.year, month: 6, day: 15}).toJSDate()),

      mode: 'lines', line: {shape:'spline',width: 0},
      type: 'scatter', hoverinfo: 'text', showlegend:false, name:'Average price'
    })
    data.push({
      y: damYealry.map(m=>m.priceMaxP90),
      x: damYealry.map(m=>DateTime.fromObject({year: m.year, month: 6, day: 15}).toJSDate()),
      mode: 'lines', line: {shape:'spline',color: '#AAA', width: 0},fill:'tonexty',
      type: 'scatter', hoverinfo: 'text', showlegend:false, name:'Average price'
    })

    data.push({
      y: damMonthly.map(m=>m.priceMean),
      x: damMonthly.map(m=>m.datetime),
      text: damMonthly.map(m=>'$' + format('.0f')(m.priceMean) + '/MWh'),
      mode: 'lines+markers', line: {color: 'black', width: 2}, marker:{size:5},
      type: 'scatter', hoverinfo: 'text', showlegend:false, name:'Average price'
    })

    data.push({
        y: damYealry.map(m=>m.priceDailyMean),
        text: damYealry.map(m=>'$' + format('.0f')(m.priceDailyMean) + '/MWh'), textposition:'top-left',
        x: damYealry.map(m=>DateTime.fromObject({year: m.year, month: 6, day: 15}).toJSDate()),
        mode: 'markers+text', line: {color: 'red', width: 2}, marker:{size:10},
        type: 'scatter', hoverinfo: 'text', showlegend:false
    })


    var layout = {
      height: 300,
      showlegend: true, legend: {orientation:'h',xanchor: 'left', x:0, y: 1},
      margin: {l: 70,r: 5,b: 30,t: 0}, font: font,
      xaxis: {
        showgrid: true, zeroline: false, ticks:'outside',showspikes: false,
        //range:years_range
      },
      yaxis: {title: '$/MWh',showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside'}
    }

    return {data, layout , config: {displayModeBar: false}}
  })
*/


</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartSolarBenchmark" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>

    </v-row>
  </PresentationPage>
</template>
