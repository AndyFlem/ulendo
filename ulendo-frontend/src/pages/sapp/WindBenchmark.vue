<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import { DateTime } from 'luxon'
  import { min, max, groups } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')(smAndUp)
  const makeTrans = inject('makeTrans')
  const categories = inject('sappDAMCategories')
  //const months = inject('months')

  //import damMonthly from '@/data/sapp/output/dam/dam_monthly.csv'
  import damDaily_raw from '@/data/sapp/output/dam/dam_daily.csv'
  import windDiurnal from '@/data/zambia_wind_solar/output/windDiurnal.csv'

  const damDaily=damDaily_raw.map(d=>{
    d.dt=DateTime.fromJSDate(d.datetime)
    d.priceEveningMean = d.priceEveningMean>0?d.priceEveningMean:null
    d.priceMorningMean = d.priceMorningMean>0?d.priceMorningMean:null
    d.priceStandardMean = d.priceStandardMean>0?d.priceStandardMean:null

    return d
  })
  import monthlyWindBenchmark from '@/data/sapp_benchmarks/output/monthlyWindBenchmarkPrice.csv'
  const latestMonthlyWindBenchmark = monthlyWindBenchmark[monthlyWindBenchmark.length-1]

  import damHourlyApr2019 from '@/data/sapp/output/dam/months/dam_2019_4_hourly.csv'
  import damHourlyJuly2023 from '@/data/sapp/output/dam/months/dam_2023_7_hourly.csv'
  const damDailyApr2019=damDaily.filter(d=>d.dt.month==4 && d.dt.year==2019)
  const damDailyJuly2023=damDaily.filter(d=>d.dt.month==7 && d.dt.year==2023)

  import damCalmonthlyHours_2019_raw from '@/data/sapp/output/dam/dam_calmonthlyhours_2019.csv'
  const damCalmonthlyHours_2019 = groups(damCalmonthlyHours_2019_raw, d => d.month).map(v=>v[1])
  import damCalmonthlyHours_2023_raw from '@/data/sapp/output/dam/dam_calmonthlyhours_2023.csv'
  const damCalmonthlyHours_2023 = groups(damCalmonthlyHours_2023_raw, d => d.month).map(v=>v[1])


  const chartWindBenchmarkMonthly = computed(() => {
    var data = [
      {
        y: monthlyWindBenchmark.map(d=>d.priceMean),
        x: monthlyWindBenchmark.map(d=>d.date),
        mode: 'lines+markers', line: {shape: '', color: colors.wind[1], width: 1.5},
        type: 'scatter', showlegend:true, fill:'tozeroy',  name:'Wind Benchmark Price',
        hovertemplate: "<b>%{x}</b><br>" +
          "%{y:,.0f} %{yaxis.title.text}" +
          "<extra></extra>",
      }
    ]

    data.push({
      y: monthlyWindBenchmark.map(m=>m.DAMPriceMean),
      x: monthlyWindBenchmark.map(m=>m.date),
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
        range:[min(monthlyWindBenchmark, d=>d.date),max(monthlyWindBenchmark, d=>d.date)]
      },
      yaxis: {
        range: [20,230],
        title: `$/MWh`,
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  })

  const chartWindBenchmarkRelativeDAM = computed(() => {
    var data = [
      {
        y: monthlyWindBenchmark.map(d=>d.windPriceRelativeDAM),
        x: monthlyWindBenchmark.map(d=>d.date),
        marker: {color: makeTrans(colors.wind[1],0.7)},
        type: 'bar', showlegend:false, fill:'tozeroy', name:'SAPP Wind Benchmark',
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
        range:[min(monthlyWindBenchmark, d=>d.date),max(monthlyWindBenchmark, d=>d.date) + 20]
      },
      yaxis: {
        title: `Difference`, range:[-0.18,0.18],
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

  const chartWindDiurnalDAM = computed(() => {
    var data = [ {
      y: windDiurnal.map(v=>v.capFactor),
      x: [...Array(24).keys()].map(v=>v),
      name: 'Wind Output',
      mode: 'lines',   line: {shape:'spline', width:4,color: colors.wind[1]}, fill:'tozeroy',
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    },
    {
      y: damCalmonthlyHours_2019[4].map(v=>v.priceMean),
      x: damCalmonthlyHours_2019[4].map(v=>v.hour),
      name: 'DAM April 2019', yaxis: 'y2',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.combined[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    },
    {
      y: damCalmonthlyHours_2023[7].map(v=>v.priceMean),
      x: damCalmonthlyHours_2023[7].map(v=>v.hour),
      name: 'DAM July 2023', yaxis: 'y2',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.combined[7]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }
    ]

    var layout = {
      height: 300,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.3},
      margin: {l: 80,r: 80,b: 50,t: 0},
      xaxis: {
        showgrid: false, zeroline: false, ticks:'outside', dtick:2,title:'Hour'
      },
      yaxis: {
        title: 'Wind <br>Output',
        showgrid: false, zeroline: false, tickformat: ',.0%', ticks:'outside', range:[-0.02,1.05],dtick:0.2
      },
      yaxis2: {
        overlaying: 'y',title:'Price $/MWh',
        side: 'right',showgrid: false, zeroline: false
        }
    }
    return {data, layout , config: {displayModeBar: false}}
  })

</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        The <b>SAPP Wind Benchmark</b> is a reference price (in $/MWh) that would be achieved by a grid-connected wind plant in eastern Zambia
        that sells all of its energy on the <a href="/sapp/dam">Southern African Power Pool (SAPP) Day-ahead Market (DAM)</a>.
        <br><br>
        The SAPP Wind Benchmark is calculated by combining the hourly settlement price of the SAPP DAM market with the average hourly
        output of a wind PV plant located in Western Zambia.
      </v-col>
      <v-col cols="12">
        The SAPP Wind Benchmark price for <b>{{ DateTime.fromJSDate(latestMonthlyWindBenchmark.date).toFormat('LLLL yyyy') }}</b> is <b>${{ format(',.0f')( latestMonthlyWindBenchmark.priceMean ) }}/MWh.</b>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartWindBenchmarkMonthly" />
          <figcaption>
            Monthly average SAPP Wind Benchmark Price and SAPP DAM market price.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartWindBenchmarkRelativeDAM" />
          <figcaption>
            Percentage difference between the SAPP Wind Benchmark and the SAPP DAM Average Price.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        Prior to 2020 the SAPP Wind Benchmark was consistently lower than the SAPP DAM Average Price by around 5%.
        Since then, the SAPP Wind Benchmark has trended higher compared to the SAPP DAM Average Price until through 2023 it was
        5 - 10% above the market.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartHourlyPrice(damHourlyApr2019, damDailyApr2019)" />
          <figcaption>
            Hourly price of the SAPP DAM market in April 2019 (grey), and daily average prices by time-of-day category - coloured lines.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartHourlyPrice(damHourlyJuly2023, damDailyJuly2023)" />
          <figcaption>
            Hourly price of the SAPP DAM market in July 2023 (grey), and daily average prices by time-of-day category - coloured lines.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        The relative value of SAPP Wind Benchmark and the DAM Market price in these periods has primarily been driven by the relative price of standard,
        daytime energy on the SAPP DAM market compared to the price of morning and evening peak price energy.
        <br><br>
        In July 2023,for example, the SAPP Wind Benchmark rose to over 10% above the SAPP DAM Average Price
        due to relatively high evening peak prices and low standard, daytime prices.


        In July 2023, by contrast, lower evening, peak prices and higher daytime, standard prices,
        when wind output is relatively lower on average, resulted in the
        SAPP Wind Benchmark being 5% below the SAPP DAM Average Price.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartWindDiurnalDAM" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>

    </v-row>
  </PresentationPage>
</template>
