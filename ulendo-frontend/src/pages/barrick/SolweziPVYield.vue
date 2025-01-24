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

  import kalumbilaAnnualExceedance from '@/data/kalumbila/output/kalumbilaAnnualExceedance.csv'
  import kalumbilaDurationVariability from '@/data/kalumbila/output/kalumbilaDurationVariability.csv'
  import kalumbilaStatistics_raw from '@/data/kalumbila/output/kalumbilaStatistics.csv'
  const kalumbilaStatistics = kalumbilaStatistics_raw[0]
  import kalumbilaCalmonthly from '@/data/kalumbila/output/kalumbilaCalmonthly.csv'
  import kalumbilaCalmonthlyHours_raw from '@/data/kalumbila/output/kalumbilaCalmonthlyHours.csv'
  const kalumbilaCalmonthlyHours = groups(kalumbilaCalmonthlyHours_raw, d => d.month).map(v=>v[1])
  import kalumbilaMonthly from '@/data/kalumbila/output/kalumbilaMonthly.csv'

  function chartMonthlyEnergy() {
    var data = [
      {
        x: kalumbilaMonthly.map(v=>v.datetime),
        y: kalumbilaMonthly.map(v=>v.energyMWh/1000),
        type: 'bar', showlegend:false,
        marker: {color: makeTrans(colors.solar[1],0.7)}
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
        showgrid: true, zeroline: false, tickformat: '.1f', ticks:'outside',

      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartAnnualYieldExceedance() {
    var data = [
      {
        x: kalumbilaAnnualExceedance.map(v => v.exceedance),
        y: kalumbilaAnnualExceedance.map(v => v.energyMWh/1000),
        type: 'scatter', showlegend:false, hoverinfo:'x+y',name: 'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.solar[1]}
      },{
        text: ['P50 - ' + format(',.1f')(kalumbilaStatistics.medianAnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.5],
        y: [kalumbilaStatistics.medianAnnualEnergyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P10 - ' + format(',.1f')(kalumbilaStatistics.p90AnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.1],
        y: [kalumbilaStatistics.p90AnnualEnergyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'left',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P90 - ' + format(',.1f')(kalumbilaStatistics.p10AnnualEnergyMWh/1000) + ' GWh/year'],
        x: [0.9],
        y: [kalumbilaStatistics.p10AnnualEnergyMWh/1000],
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
        y: kalumbilaDurationVariability.map(v=>v.p50/1000),
        text: kalumbilaDurationVariability.map(v=>format('.1f')(v.p50/1000) + 'GWh'),
        x: kalumbilaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P50',
        marker:{size: kalumbilaDurationVariability.map(v=>v.duration_years==15?13:6)},
        line: { shape: 'spline', dash:'dash', color: colors.solar[1], width: 3 },
        type: 'scatter'
      },
      {
        y: kalumbilaDurationVariability.map(v=>v.p75/1000),
        text: kalumbilaDurationVariability.map(v=>format('.1f')(v.p75/1000) + 'GWh'),
        x: kalumbilaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P75 Exceedance',
        marker:{size: kalumbilaDurationVariability.map(v=>v.duration_years==15?13:6)},
        line: { shape: 'spline', color: colors.solar[2], width: 2.5 },
        type: 'scatter'
      },
      {
        y: kalumbilaDurationVariability.map(v=>v.p90/1000),
        text: kalumbilaDurationVariability.map(v=>format('.1f')(v.p90/1000) + 'GWh'),
        x: kalumbilaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P90',
        line: { shape: 'spline', color: colors.solar[3], width: 2 },
        type: 'scatter'
      },
      {
        y: kalumbilaDurationVariability.map(v=>v.p99/1000),
        text: kalumbilaDurationVariability.map(v=>format('.1f')(v.p99/1000) + 'GWh'),
        x: kalumbilaDurationVariability.map(v=>v.duration_years),
        mode: 'lines',
        hoverinfo:'name+x+text', name: 'P99',
        line: { shape: 'spline', color: colors.solar[4], width: 1.5 },
        type: 'scatter'
      },{
        text: ['10 Year P90 - ' + format(',.1f')(kalumbilaDurationVariability[1].p90/1000) + ' GWh/year'],
        x: [10],
        y: [kalumbilaDurationVariability[1].p90/1000],
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
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.p90MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false,
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.p10MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.medianMonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: 'Solar',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.solar[1], dash:''}
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
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',
        range: [6,15]
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDailyEnergyPerCalMonth() {
    var data = [
      {
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.p90DailyEnergyMWh),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.p10DailyEnergyMWh),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>v.medianDailyEnergyMWh),
        type: 'scatter', showlegend:false, name: 'Solar',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.solar[1], dash:''}
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
        range:[150,550]
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDailyWeatherPerCalMonth() {
    var data = [
      {
        x: kalumbilaCalmonthly.map(v=>v.month),
        y: kalumbilaCalmonthly.map(v=>-v.meanDailyWeatherImpact),
        type: 'bar', showlegend:false, name: 'P90',
        mode:'lines', marker: {shape: 'spline',width:3, color: makeTrans(colors.solar[1],0.7)}
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
        title: 'Daily Yield Reduction',
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDiurnalByMonth(indx) {
    var data = [{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.p90HourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.p10HourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.meanHourlyEnergyMWh),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.9),width:1.5}, fill:'',
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
        <h1>Solwezi Solar PV Project - Yield Analysis</h1>
        The {{kalumbilaStatistics.capacity}}MW Solwezi Solar PV project will be constructed in Sesheke District, Western Province, Zambia.
        Construction is due to commence in 2025 and the first energy will be generated in 2026.
        <br><br>
        This yield analysis for a {{kalumbilaStatistics.capacity}}MW solar PV project located in the Solwezi area of
        Northwestern Province of Zambia is based on historic satellite derived solar irradiation data for the project site and
        yield modelling using the PVsyst software.
      </v-col>
      <v-col cols="12">
        <h2>Summary</h2>
          <b>Capacity:</b>&nbsp;{{kalumbilaStatistics.capacity}}MW<br>
          <b>Mean annual energy:</b>&nbsp;{{format(',.0f')(kalumbilaStatistics.medianAnnualEnergyMWh/1000)}} GWh<br>
          <b>Mean specific energy:</b>&nbsp;{{format(',.1f')(kalumbilaStatistics.meanAnnualSpecificYield/1000)}} GWh/MW<br>
          <b>Mean capacity factor:</b>&nbsp;{{format(',.0%')(kalumbilaStatistics.meanAnnualCapFactor)}} <br>
          <b>Coefficient of variation annual energy:</b>&nbsp;{{format(',.0%')(kalumbilaStatistics.coefVarAnnualEnergy)}} <br>
      </v-col>
      <v-col cols="12">
        <h2>Yield Timeseries</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="10" xl="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyEnergy()" />
          <figcaption>
           Monthly energy yield for the Solwezi Solar PV Plant.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h2>Annual Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartAnnualYieldExceedance()" />
          <figcaption>
            Annual energy exceedance probability curve for the Solwezi Solar PV Project showing the probability of exceeding a given annual energy yield.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartDurationVariability()" />
          <figcaption>
            Annual energy yield variability for the Solwezi Solar PV Project showing the annual energy yield for different durations of variability.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h2>Monthly Yield</h2>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyEnergyPerCalMonth()" />
          <figcaption>
           Average monthly energy yield - solid line - and P90 to P10 range of energy
          yield (filled area) by calendar month for the Solwezi Solar PV Plant.
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
          yield (filled area) by calendar month for the Solwezi Solar PV Plant.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartDailyWeatherPerCalMonth()" />
          <figcaption>
            Average daily reduction in energy yield due to weather conditions by calendar month for the Solwezi Solar PV Plant.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h2>Diurnal Yield Variability</h2>
      </v-col>
      <v-col cols="12">
        <v-row :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <v-col :key="mon" v-for="mon in Array.from(new Array(12), (x,i) => i)" cols="12" sm="6" md="4">
            <PlotlyChart :definition="chartDiurnalByMonth(mon)" />
          </v-col>

          <figcaption>
            Average diurnal energy yield for the Solwezi Solar PV Plant by calendar month showing the P90 to P10 range of hourly energy yield (filled area)
            and the median hourly energy yield (solid line).
          </figcaption>
        </v-row>
      </v-col>
    </v-row>
  </PresentationPage>
</template>
