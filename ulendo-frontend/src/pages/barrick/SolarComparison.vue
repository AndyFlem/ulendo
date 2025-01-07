<script setup>
  import {  inject } from 'vue'
  import { useDisplay } from 'vuetify'

  import { groups } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')

  const font = inject('font')
  const makeTrans = inject('makeTrans')
  const months = inject('months')

  import shStatistics_raw from '@/data/ilute/output/iluteStatistics.csv'
  const shStatistics = shStatistics_raw[0]
  import shCalmonthly from '@/data/ilute/output/iluteCalmonthly.csv'

  import cbStatistics_raw from '@/data/kalumbila/output/kalumbilaStatistics.csv'
  const cbStatistics = cbStatistics_raw[0]
  import cbCalmonthly from '@/data/kalumbila/output/kalumbilaCalmonthly.csv'

  import mixedCalmonthly_raw from '@/data/solar_mixing/output/SolarMixingCalmonthly.csv'
  const mixedCalmonthly=groups(mixedCalmonthly_raw, d => d.site1Scale).map(v=>v[1])



  function chartDailyEnergyPerCalMonth() {
    var data = [
    {
        x: cbCalmonthly.map(v=>v.month),
        y: cbCalmonthly.map(v=>v.p90DailySpecificYield),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: cbCalmonthly.map(v=>v.month),
        y: cbCalmonthly.map(v=>v.p10DailySpecificYield),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: cbCalmonthly.map(v=>v.month),
        y: cbCalmonthly.map(v=>v.meanDailySpecificYield),
        type: 'scatter', showlegend:true, name: 'Copperbelt',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.solar[1], dash:''}
      },{
        x: shCalmonthly.map(v=>v.month),
        y: shCalmonthly.map(v=>v.p90DailySpecificYield),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: shCalmonthly.map(v=>v.month),
        y: shCalmonthly.map(v=>v.p10DailySpecificYield),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.storage[1]}
      },{
        x: shCalmonthly.map(v=>v.month),
        y: shCalmonthly.map(v=>v.meanDailySpecificYield),
        type: 'scatter', showlegend:true, name: 'Sesheke',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.storage[1], dash:''}
      }, {
        x: mixedCalmonthly[1].map(v=>v.month),
        y: mixedCalmonthly[1].map(v=>v.p90DailySpecificYield),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: mixedCalmonthly[1].map(v=>v.month),
        y: mixedCalmonthly[1].map(v=>v.p10DailySpecificYield),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.combined[1]}
      },{
        x: mixedCalmonthly[1].map(v=>v.month),
        y: mixedCalmonthly[1].map(v=>v.meanDailySpecificYield),
        type: 'scatter', showlegend:true, name: 'Mixed',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.combined[1], dash:''}
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
        title: 'Daily Specific Yield MWh/MW',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }


  function chartDailyWeatherPerCalMonth() {
    var data = [
      {
        x: shCalmonthly.map(v=>v.month),
        y: shCalmonthly.map(v=>-v.meanDailyWeatherImpact),
        type: 'bar', showlegend:true, name: 'Sesheke',
        mode:'lines', marker: {shape: 'spline',width:3, color: makeTrans(colors.storage[1],0.7)}
      },{
        x: cbCalmonthly.map(v=>v.month),
        y: cbCalmonthly.map(v=>-v.meanDailyWeatherImpact),
        type: 'bar', showlegend:true, name: 'Copperbelt',
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
        title: 'Average Daily Yield Reduction',
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCombinedDailyIntermittency() {

    var data = [
      {
        x: mixedCalmonthly[2].map(v=>v.month),
        y: mixedCalmonthly[2].map(v=>v.coefVarDailyCapFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none',name: 'Sesheke Only',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.storage[1]}
      },
      {
        x: mixedCalmonthly[0].map(v=>v.month),
        y: mixedCalmonthly[0].map(v=>v.coefVarDailyCapFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none', name:'Copperbelt Only',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.solar[1]}
      },{
        x: mixedCalmonthly[1].map(v=>v.month),
        y: mixedCalmonthly[1].map(v=>v.coefVarDailyCapFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none',name:'Sesheke and Copperbelt Solar PV',
        mode:'lines', line: {shape: 'spline',width:3, color: colors.combined[1]}
      }]

    var layout = {
      height: 300, font: font, showlegend: true,
      margin: {t:5,b:50,l:70,r:60}, barmode:'stack',
      legend: {orientation: 'h', x: 0, xanchor: 'left', y: -0.15},
      xaxis: {
        showgrid: false, zeroline: false, ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      },
      yaxis: {
        title: 'Coefficient of Variation <br>Daily Yield',
        zeroline: false, showline: false, showgrid:false, tickformat: '.0%'
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }


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
            <span class="text-h4 text-sm-h3 text-md-h2">Sesheke and Copperbelt Solar PV</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="12" sm="10" md="6">
                <v-table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Sesheke</th>
                      <th>Copperbelt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Mean Annual Energy</b> MWh/MW</td>
                      <td>{{ format(',.0f')(shStatistics.meanAnnualSpecificYield) }}</td>
                      <td>{{ format(',.0f')(cbStatistics.meanAnnualSpecificYield) }} ({{ format(',.1%')((cbStatistics.meanAnnualSpecificYield - shStatistics.meanAnnualSpecificYield)/shStatistics.meanAnnualSpecificYield) }})</td>
                    </tr>
                    <tr>
                      <td><b>Coefficient of Variation - Annual Energy</b></td>
                      <td>{{ format(',.1%')(shStatistics.coefVarAnnualEnergy) }}</td>
                      <td>{{ format(',.1%')(cbStatistics.coefVarAnnualEnergy) }}</td>
                    </tr>
                    <tr>
                      <td><b>Average annual impact of weather</b></td>
                      <td>{{ format(',.1%')(shStatistics.meanDailyWeatherImpact) }}</td>
                      <td>{{ format(',.1%')(cbStatistics.meanDailyWeatherImpact) }}</td>
                    </tr>

                  </tbody>

                </v-table>
              </v-col>
            </v-row>
          </v-col>

          <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartDailyEnergyPerCalMonth()" />
              <figcaption>
                Average daily relative yield (lines) and P10-P90 range of daily relative yield (area) for solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Copperbelt).
              </figcaption>
            </v-sheet>
          </v-col>

          <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartDailyWeatherPerCalMonth()" />
              <figcaption>
                Impact of cloud on average daily yield for a solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Copperbelt).
              </figcaption>
            </v-sheet>
          </v-col>
          <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartCombinedDailyIntermittency()" />
              <figcaption>
                Intermittency - represented by the coefficient of variation in daily yield by calendar month - for solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Copperbelt) and
                for a combined plant with 50% capacity in Sesheke and 50% capacity in the Copperbelt.
              </figcaption>
            </v-sheet>
          </v-col>


        </v-row>
      </v-col>
    </v-row>
  </PresentationPage>


</template>
