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
        type: 'scatter', showlegend:true, name: 'Solwezi',
        mode:'lines', line: {shape: 'spline',width:2.5, color: colors.solar[1], dash:''}
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
        mode:'lines', line: {shape: 'spline',width:2.5, color: colors.storage[1], dash:''}
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
        title: 'Daily Energy MWh/MW',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }
  /*
  function chartDailyEnergyPerCalMonthMixed() {
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
        type: 'scatter', showlegend:true, name: 'Solwezi',
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
*/
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
        type: 'bar', showlegend:true, name: 'Solwezi',
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
        title: 'Average Daily Energy Reduction',
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
        type: 'scatter', showlegend:true, hoverinfo:'none', name:'Solwezi Only',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.solar[1]}
      },{
        x: mixedCalmonthly[1].map(v=>v.month),
        y: mixedCalmonthly[1].map(v=>v.coefVarDailyCapFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none',name:'Sesheke and Solwezi Solar PV',
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
        title: 'Coefficient of Variation <br>Daily Energy',
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
            <span class="text-h4 text-sm-h3 text-md-h2">Sesheke and Solwezi Solar PV</span>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            The energy yield of Solar PV plants depends on the solar resource at the site coupled with the plant efficiency.
            The basic solar resource depends on latitude - with higher irradiation closer to the equator.
            However, the solar resource is then degraded by local weather conditions, such as temparature (solar PV units are more efficient
            at lower temparatures), smoke and dust haze and in particular cloud cover.
            <br><br>
            Local weather conditions will impact the long-term yield of a solar PV plants - with wetter,
            cloudier locations having lower yields - but, can also affect the intermittency of the
            plant at shorter timescales - with cloudier locations having higher intermittency and lower reliability of yield.

            Higher intermittency can increase offtaker energy cost by requiring greater amounts of expensive,
            short-term balancing services.
            <br><br>
            Comparing modelled yield statistics for solar PV plants at two sites in Zambia, in the drier, colder south west at Sesheke
            and in the north west at Solwezi shows the impact of local weather conditions on yield and intermittency.
            By considering a combination of capacity at the two sites, the smoothing effect provided by varying cloud cover
            at the two sites can be shown.
          </v-col>
          <v-col cols="12">
            <v-row>
              <v-col cols="12" sm="10" md="6">
                <v-table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Sesheke</th>
                      <th>Solwezi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Latitude</b></td>
                      <td>17deg S</td>
                      <td>12deg S</td>
                    </tr>
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
                <figcaption>
                  Table 1. yield statistics for Solar PV plants at two sites in Zambia, in the drier, colder south west at Sesheke and in the north west at Solwezi.
                </figcaption>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12">
            The daily yield across the year for the two sites (Fig 1) shows that the Solwezi site has a higher average yield
            (solid lines) in the cloud-free winter months May to July - due to it being closer to the equator - but,
            at all other times of year the Sesheke site has higher average yield - because of lower temperatures and less cloud cover.

            <br><br>
            Overall, Table 1 shows that the average annual yield for Solar PV at Solwezi is 5% lower than at Sesheke.
            Variability in this annual yield is low and consistent for the two sites at 2% - both plants act as baseload on an
            annual basis.
          </v-col>
          <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartDailyEnergyPerCalMonth()" />
              <figcaption>
                Fig 1. Average daily energy (lines) and P10-P90 range of daily energy (area) for solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Solwezi).
              </figcaption>
            </v-sheet>
          </v-col>
          <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartDailyWeatherPerCalMonth()" />
              <figcaption>
                Fig 2. Impact of cloud on average daily energy for a solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Solwezi).
              </figcaption>
            </v-sheet>
          </v-col>
          <v-col cols="12">
            The differing average impact of weather (cloud) on solar PV at the two sites in Zambia through the year
            is shown in Fig 2. by comparing the theoretical maximum yield from the plants with the actual modelled longterm yield.
            Energy loss due to weather is around 5% higher at Solwezi compared to Sesheke during the rainy season, from November to April.
          </v-col>
          <v-col :class="smAndUp?'':'px-0'" cols="12" md="8" xl="6">
            <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
              <PlotlyChart :definition="chartCombinedDailyIntermittency()" />
              <figcaption>
                Fig 3. Intermittency - represented by the coefficient of variation in daily yield by calendar month - for solar PV plants located in western Zambia (Sesheke) and northwestern Zambia (Solwezi) and
                for a combined plant with 50% capacity in Sesheke and 50% capacity in the Solwezi.
              </figcaption>
            </v-sheet>
          </v-col>
          <v-col cols="12">
            Splitting a solar PV plant into two or more locations on the same interconnected grid system
            can reduce the shortterm intermittency of the combined plant as yield reduction casued by
            partial cloud cover will not be completely correlated at two geographically distinct locaitons.
            <br><br>
            In Fig 3. the intermittency of output for solar PV plants at Sesheke and Solwezi across and average year
            is shown through the coefficient of variation (standard deviation as a percentage of the mean) of daily
            energy output for each plant.
            <br><br>
            Both locations exhibit a similar level of intermittency at the daily timescale. However,
            combining the output of the two plants reduces their combined intermittency by as much as 5%
            during the summer, rainy seeason.
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </PresentationPage>


</template>
