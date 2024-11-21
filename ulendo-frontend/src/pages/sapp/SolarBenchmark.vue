<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import { DateTime } from 'luxon'
  import { min, max } from 'd3-array'
  //import { groups, min, max, mean, sum } from 'd3-array'
  //import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')(smAndUp)
  const makeTrans = inject('makeTrans')
  const categories = inject('sappDAMCategories')
  //const months = inject('months')

  import damMonthly from '@/data/sapp/output/dam/dam_monthly.csv'
  import damDaily_raw from '@/data/sapp/output/dam/dam_daily.csv'
  const damDaily=damDaily_raw.map(d=>{
    d.dt=DateTime.fromJSDate(d.datetime)
    d.priceEveningMean = d.priceEveningMean>0?d.priceEveningMean:null
    d.priceMorningMean = d.priceMorningMean>0?d.priceMorningMean:null
    d.priceStandardMean = d.priceStandardMean>0?d.priceStandardMean:null

    return d
  })
  import monthlySolarBenchmark from '@/data/sapp_benchmarks/output/monthlySolarBenchmarkPrice.csv'
  import damHourlyJan2024 from '@/data/sapp/output/dam/months/dam_2024_1_hourly.csv'
  import damHourlyJuly2023 from '@/data/sapp/output/dam/months/dam_2023_7_hourly.csv'
  const damDailyJan2024=damDaily.filter(d=>d.dt.month==1 && d.dt.year==2024)
  const damDailyJuly2023=damDaily.filter(d=>d.dt.month==7 && d.dt.year==2023)

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
      mode: 'lines', line: {shape: '', color: '#444', width: 1}, marker:{size:2},
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

  const chartSolarBenchmarkRelativeDAM = computed(() => {
    var data = [
      {
        y: monthlySolarBenchmark.map(d=>d.solarPriceRelativeDAM),
        x: monthlySolarBenchmark.map(d=>d.date),
        marker: {color: makeTrans(colors.solar[1],0.7)},
        type: 'bar', showlegend:false, fill:'tozeroy', name:'APP Wind Benchmark',
        hovertemplate: "<b>%{x}</b><br>" +
          "%{y:.0%} %{yaxis.title.text}" +
          "<extra></extra>",
      }
    ]

    var layout = {
      height: 200,
      font: font,
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1},
      margin: {l: 70,r: 5,b: 30,t: 0},
      xaxis: {
        showgrid: true, zeroline: false, ticks: 'outside',
        range:[min(monthlySolarBenchmark, d=>d.date),max(monthlySolarBenchmark, d=>d.date)+20]
      },
      yaxis: {
        title: `Difference`,
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}

  })

  function chartHourlyPrice(hourly, selectedDays) {
    console.log(hourly,selectedDays)
    const ymax=max(hourly,h=>h.price)*1.1

    function series(ref) {
      return [{
        y: selectedDays.map(d=>d[`price${ref}Mean`]),
        x: selectedDays.map(d=>d.dt.plus({hour:ref=='Evening'?18:9}).toJSDate()),
        mode: 'lines', line: { shape:'spline',color: makeTrans(categories[ref].color,0.9), width: 4},
        type: 'scatter', hoverinfo: 'none', showlegend:true,name: categories[ref].name, fill:''
      }]
    }

    var data = []

    selectedDays.forEach(d=>{
      if (d.dayOfWeek==6) {

        data.push({
         x:[d.dt.toJSDate(),d.dt.endOf('day').toJSDate()],
         y:[ymax,ymax], fillcolor:makeTrans('#f4a4a4',0.3),
         line: {width:0},mode:'lines',showlegend:false,
         fill:'tozeroy', hoverinfo:'none'
        })
      }
      if (d.dayOfWeek==7) {
        data.push({
         x:[d.dt.toJSDate(),d.dt.endOf('day').toJSDate()],
         y:[ymax,ymax], fillcolor:makeTrans('#f4a4a4',0.5),
         fill:'tozeroy', hoverinfo:'none',
         line: {width:0},mode:'lines',showlegend:false
        })
      }
    })
    data.push({
      y: hourly.map(h=>h.price),
      x: hourly.map(h=>h.datetime),
      mode: 'lines', line: {color:'#AAA', width: 1.4},
      type: 'scatter', hoverinfo: 'x,y', showlegend:true,name: 'Hourly price',
    })
    Object.values(categories).forEach(c=>{data=data.concat(series(c.ref))})

    var layout = {
      height: 300,
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 70,r: 5,b: 50,t: 0},font:font,
      xaxis: {
        range: [hourly[0].date,hourly[hourly.length-1].date],
        showgrid: true, zeroline: false, ticks:'outside'
      },
      yaxis: {
        range:[0,300],
        title: '$/MWh',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        The <b>SAPP Solar Benchmark</b> is a reference price (in $/MWh) that would be achieved by a nominal grid-connected solar PV plant
        that sells all of its energy on the <a href="/sapp/dam">Southern African Power Pool (SAPP) Day-ahead Market (DAM)</a>.
        <br><br>
        The SAPP Solar Benchmark is calculated by combining the hourly settlement price of the SAPP DAM market with the hourly
        relative output of a solar PV plant located in Western Zambia.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartSolarBenchmark" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartSolarBenchmarkRelativeDAM" />
          <figcaption>
            Percentage difference between the SAPP Solar Benchmark and the SAPP DAM Average Price.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        Prior to 2020 the SAPP Solar Benchmark was consistently higher than the SAPP DAM Average Price by between 10 - 20%.
        Since then, the SAPP Solar Benchmark has trended lower compared to the SAPP DAM Average Price until through 2023 it was consistently
        15 - 25% below the market.
        <br><br>
        The relative value of SAPP Solar Benchmark in these periods has primarily been driven by the relative price of standard,
        daytime energy on the SAPP DAM market compared to the price of morning and evening peak price energy. In January 2024,
        for example, the SAPP Solar Benchmark rose to over 40% above the SAPP DAM Average Price due to a spike in the price
        of standard, daytime energy on the SAPP DAM market along with relatively low evening, peak prices.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartHourlyPrice(damHourlyJan2024, damDailyJan2024)" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartHourlyPrice(damHourlyJuly2023, damDailyJuly2023)" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>

    </v-row>
  </PresentationPage>
</template>
