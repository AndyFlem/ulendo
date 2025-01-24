<script setup>
  import {  inject } from 'vue'
  import { useDisplay } from 'vuetify'
  import { format } from 'd3-format'
  import { groups } from 'd3-array'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const months = inject('months')
  const makeTrans = inject('makeTrans')

  import unikaYearly from '@/data/unika2/output/unikaYearly.csv'

  import unikaAnnualExceedance from '@/data/unika2/output/unikaAnnualExceedance.csv'
  import unikaDurationVariability from '@/data/unika2/output/unikaDurationVariability.csv'
  import unikaStatistics_raw from '@/data/unika2/output/unikaStatistics.csv'
  import unikaCalmonthly from '@/data/unika2/output/unikaCalmonthly.csv'
  const unikaStatistics = unikaStatistics_raw[0]

  import unikaCalmonthlyHours_raw from '@/data/unika2/output/unikaCalmonthlyHours.csv'
  const unikaCalmonthlyHours = groups(unikaCalmonthlyHours_raw, d => d.month).map(v=>v[1])
  import unikaMonthly from '@/data/unika2/output/unikaMonthly.csv'

  function chartAnnualEnergy() {
    var data = [
      {
        x: unikaYearly.map(v=>v.year),
        y: unikaYearly.map(v=>v.energyMWh/1000),
        type: 'bar', showlegend:false,
        marker: {color: makeTrans(colors.wind[1],0.7)}
      }]

    var layout = {
      height: 320,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
      },
      yaxis: {
        title: 'Annual Energy GWh',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside', range:[500,660]

      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }


  function chartMonthlyEnergy() {
    var data = [
      {
        x: unikaMonthly.map(v=>v.datetime),
        y: unikaMonthly.map(v=>v.energyMWh/1000),
        type: 'bar', showlegend:false,
        marker: {color: makeTrans(colors.wind[1],0.7)}
      }]

    var layout = {
      height: 320,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
      },
      yaxis: {
        title: 'Monthly Energy GWh',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartAnnualYieldExceedance() {
    var data = [
      {
        x: unikaAnnualExceedance.map(v => v.exceedance),
        y: unikaAnnualExceedance.map(v => v.energyMWh/1000),
        type: 'scatter', showlegend:false, hoverinfo:'x+y',name: 'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.wind[1]}
      },{
        text: ['P50 - ' + format(',.1f')(unikaStatistics.medianAnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.5],
        y: [unikaStatistics.medianAnnualEnergyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P10 - ' + format(',.1f')(unikaStatistics.p90AnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.1],
        y: [unikaStatistics.p90AnnualEnergyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'left',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P90 - ' + format(',.1f')(unikaStatistics.p10AnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.9],
        y: [unikaStatistics.p10AnnualEnergyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      }]

    var layout = {
      height: 300,
      showlegend: true, legend: {xanchor: 'left', x:0, y: 1, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
      xaxis: {
        showgrid: false, dtick:0.1,
        zeroline: false, tickformat:'.0%', range: [1,-0.02],
        ticks:'outside', title: 'Exceedance Probability'
      },
      yaxis: {
        showgrid: true,zeroline: false,
        showline: false,title: 'GWh',
        tickformat: ',.0f',

      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDurationVariability() {
    var data = [
    {
        y: unikaDurationVariability.map(v=>v.p50/1000),
        text: unikaDurationVariability.map(v=>format('.1f')(v.p50/1000) + 'GWh'),
        x: unikaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P50',
        marker:{size: unikaDurationVariability.map(v=>v.duration_years==15?13:6)},
        line: { shape: 'spline', dash:'dash', color: colors.wind[1], width: 3 },
        type: 'scatter'
      },
      {
        y: unikaDurationVariability.map(v=>v.p75/1000),
        text: unikaDurationVariability.map(v=>format('.1f')(v.p75/1000) + 'GWh'),
        x: unikaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P75 Exceedance',
        marker:{size: unikaDurationVariability.map(v=>v.duration_years==15?13:6)},
        line: { shape: 'spline', color: colors.wind[2], width: 2.5 },
        type: 'scatter'
      },
      {
        y: unikaDurationVariability.map(v=>v.p90/1000),
        text: unikaDurationVariability.map(v=>format('.1f')(v.p90/1000) + 'GWh'),
        x: unikaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P90',
        line: { shape: 'spline', color: colors.wind[3], width: 2 },
        type: 'scatter'
      },
      {
        y: unikaDurationVariability.map(v=>v.p99/1000),
        text: unikaDurationVariability.map(v=>format('.1f')(v.p99/1000) + 'GWh'),
        x: unikaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P99',
        line: { shape: 'spline', color: colors.wind[4], width: 1.5 },
        type: 'scatter'
      },{
        text: ['10 Year P90 - ' + format(',.1f')(unikaDurationVariability[1].p90/1000) + ' GWh/year'],
        x: [10],
        y: [unikaDurationVariability[1].p90/1000],
        type: 'scatter', showlegend:false,hoverinfo:'none',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      }
    ]
    var layout = {
      height:300,
      margin: {t:10, b:60, l:90, r:10},
      font: font, showlegend: true,
      legend: {orientation:'h', x: 0.2, xanchor: 'left', y: 0.2 },
      xaxis: {
        showgrid: true, zeroline: false,
        dtick: 5, ticks: 'outside',
        title: 'Years of Annual Variability'
      },
      yaxis: {
        title: 'Annual Energy (GWh)',
        zeroline: false, showline: false,
        separatethousands: true,
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartMonthlyEnergyPerCalMonth() {

    var data = [
      {
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.p90MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false,
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.p10MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.medianMonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: 'Solar',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.wind[1], dash:''}
      }]

    var layout = {
      height: 370,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext: months,
        range:[0.5,12.5]
      },
      yaxis: {
        title: 'Monthly Energy GWh',
        showgrid: true, zeroline: false, tickformat: '.1f', ticks:'outside',

      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDailyEnergyPerCalMonth() {
    var data = [
      {
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.p90DailyEnergyMWh),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.p10DailyEnergyMWh),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: unikaCalmonthly.map(v=>v.month),
        y: unikaCalmonthly.map(v=>v.medianDailyEnergyMWh),
        type: 'scatter', showlegend:false, name: 'Solar',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.wind[1], dash:''}
      }]

    var layout = {
      height: 370,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 30,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext: months,
        range:[0.5,12.5]
      },
      yaxis: {
        title: 'Daily Energy MWh',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDiurnalByMonth(indx) {
    var data = [{
      y:unikaCalmonthlyHours[indx].map(v=>v.p90HourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:unikaCalmonthlyHours[indx].map(v=>v.p10HourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:unikaCalmonthlyHours[indx].map(v=>v.meanHourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.9),width:1.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    }]


    var layout = {
      height: 150, width: 350,
      font: font, hovermode:'closest', title:{xref:'paper',x: 0.05, yref:'paper', y:0.85, font:{size: 16}, text:months[indx]},
      showlegend: false,
      margin: {l: 40,r: 10,b: 40,t: 0},
      xaxis: {
        showgrid: false, zeroline: false, ticks:'outside', dtick:4, range:[0,23], visible:indx==0
      },
      yaxis: {
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'none',
        showticklabels:indx==0,showticks:false,
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        <h1>Unika II Wind Project - Yield Analysis</h1>
        The {{unikaStatistics.capacity}}MW Unika II Wind Project will be constructed in Katete district of Eastern Province, Zambia.
        Installation of the 19 6.5MW wind turbines is expected to commence in 2027 and be completed by the end of 2028.
        <br><br>
        This statistical analysis on the energy produciton of the project is based on satellite derived historic wind data for the site
        combined with wind measurements from a met mast installed at the project site and modelling completed for the Unika I project.
      </v-col>
      <v-col cols="12">
        <h2>Summary</h2>
          <b>Capacity:</b>&nbsp;{{unikaStatistics.capacity}}  MW<br>
          <b>Mean annual energy:</b>&nbsp;{{format(',.0f')(unikaStatistics.medianAnnualEnergyMWh/1000)}} GWh<br>
          <b>Mean specific energy:</b>&nbsp;{{format(',.1f')(unikaStatistics.meanAnnualSpecificYield/1000)}} GWh/MW<br>
          <b>Mean capacity factor:</b>&nbsp;{{format(',.0%')(unikaStatistics.meanAnnualCapFactor)}} <br>
          <b>Coefficient of variation annual energy:</b>&nbsp;{{format(',.0%')(unikaStatistics.coefVarAnnualEnergy)}} <br>
      </v-col>
      <v-col cols="12">
        <h2>Annual Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="10" xl="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartAnnualEnergy()" />
          <figcaption>
           Simulated annual energy production for the Unika II Wind Plant based on historic wind data.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartAnnualYieldExceedance()" />
          <figcaption>
            Annual energy exceedance probability curve for the Unika II Wind Project showing the probability of exceeding a given annual energy yield.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartDurationVariability()" />
          <figcaption>
            Annual energy yield variability for the Unika II Wind Project showing the annual energy yield for different durations of variability.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h2>Monthly Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="10" xl="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyEnergy()" />
          <figcaption>
           Monthly energy yield for the Unika II Wind Plant.
        </figcaption>
        </v-sheet>
      </v-col>

      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyEnergyPerCalMonth()" />
          <figcaption>
           Average monthly energy yield - solid line - and P90 to P10 range of energy
          yield (filled area) by calendar month for the Unika II Wind Plant.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h2>Daily Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartDailyEnergyPerCalMonth()" />
          <figcaption>
          Average daily energy yield - solid line - and P90 to P10 range of energy
          yield (filled area) by calendar month for the Unika II Wind Plant.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6"></v-col>
      <v-col cols="12">
        <h2>Diurnal Yield Variability</h2>
      </v-col>
      <v-col cols="12">
        <v-row :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <v-col :key="mon" v-for="mon in Array.from(new Array(12), (x,i) => i)" cols="12" sm="6" md="4">
            <PlotlyChart :definition="chartDiurnalByMonth(mon)" />
          </v-col>
          <figcaption>
            Average diurnal energy yield for the Unika II Wind Plant by calendar month showing the P90 to P10 range of hourly energy yield (filled area)
            and the median hourly energy yield (solid line).
          </figcaption>
        </v-row>
      </v-col>
    </v-row>
  </PresentationPage>
</template>
