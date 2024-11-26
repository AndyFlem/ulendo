<script setup>
  import { ref, inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import PlotlyChart from '@/components/PlotlyChart.vue'
  import PresentationPage from '@/components/PresentationPage.vue'
  import { groups, min, max, mean, sum } from 'd3-array'
  import { format } from 'd3-format'

  const { smAndUp } = useDisplay()

  const font = inject('font')
  const months = inject('months')
  const colors = inject('colors')
  const makeTrans = inject('makeTrans')

  import solarDiurnal from '@/data/ilute/output/iluteDiurnal.csv'
  import solarCalmonthly from '@/data/ilute/output/iluteCalmonthly.csv'
  import solarCalmonthlyHours_raw from '@/data/ilute/output/iluteCalmonthlyHours.csv'
  const solarCalmonthlyHours = groups(solarCalmonthlyHours_raw, d => d.month).map(v=>v[1])

  import windDiurnal from '@/data/unika/output/unikaDiurnal.csv'
  import windCalmonthly from '@/data/unika/output/unikaCalmonthly.csv'
  import windCalmonthlyHours_raw from '@/data/unika/output/unikaCalmonthlyHours.csv'
  const windCalmonthlyHours = groups(windCalmonthlyHours_raw, d => d.month).map(v=>v[1])

  const selectedRatio=ref(39)
  const ratio = computed(() => {
    return selectedRatio.value/99
  })

  const combinationModels = (() => {
    let steps = 100
    let ret = [...Array(steps).keys()].map(v=>{
      return {
        ratio: (1/(steps-1))*v
      }
    })

    ret.map(ratio => {
      ratio.combined_cfs = [...Array(12).keys()].map(month_no=>{
      return [...Array(24).keys()].map(hour_no =>
        ((solarCalmonthlyHours[month_no][hour_no].meanHourlyCapFactor * ratio.ratio) + windCalmonthlyHours[month_no][hour_no].meanHourlyCapFactor) / (1+ratio.ratio))
      })

      ratio.monthly_av_cfs = [...Array(12).keys()].map(month_no=>{
        return mean(ratio.combined_cfs[month_no])
      })

      ratio.monthly_store = [...Array(12).keys()].map(month_no=>{
        return sum(ratio.combined_cfs[month_no].map(v=>v>ratio.monthly_av_cfs[month_no]?v-ratio.monthly_av_cfs[month_no]:0))
      })
      ratio.store_hours = [...Array(12).keys()].map(month_no=>{
        return ratio.combined_cfs[month_no].filter(v=>v>ratio.monthly_av_cfs[month_no]).length
      })
      ratio.store_max = max(ratio.monthly_store)
      ratio.store_range = max(ratio.monthly_store) - min(ratio.monthly_store)

      return ratio
    })

    return ret
  })()

  const optimumCombination=combinationModels.filter(w=>w.store_max==min(combinationModels.map(v=>v.store_max)))[0]

  const chartWindSolarDiurnal = computed(() => {
    var data = [ {
      y: windDiurnal.map(v=>v.meanCapFactor),
      x: [...Array(24).keys()].map(v=>v+1),
      name: 'Wind',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.wind[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }, {
      y: solarDiurnal.map(v=>v.meanCapFactor),
      x: [...Array(24).keys()].map(v=>v+1),
      name: 'Solar',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.solar[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }  ]

    var layout = {
      height: 230,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 80,r: 5,b: 30,t: 0},
      xaxis: {
        showgrid: false, zeroline: false, ticks:'outside', dtick:2,
      },
      yaxis: {
        title: 'Average hourly <br>output',
        showgrid: true, zeroline: false, tickformat: ',.0%', ticks:'outside', range:[-0.02,1.05],dtick:0.2
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  })

  const chartWindSolarMonthly = computed(() => {
    var data = [ {
      y: windCalmonthly.map(v=>v.meanDailyCapFactor),
      x: [...Array(12).keys()].map(v=>v+1),
      name: 'Wind',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.wind[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }, {
      y: solarCalmonthly.map(v=>v.meanDailyCapFactor),
      x: [...Array(12).keys()].map(v=>v+1),
      name: 'Solar',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.solar[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }  ]

    var layout = {
      height: 230,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 80,r: 5,b: 30,t: 0},
      xaxis: {
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        showgrid: false, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Average daily <br>output',
        showgrid: true, zeroline: false, tickformat: ',.0%', ticks:'outside',dtick:0.2
      }
    }

    return {data, layout , config: {displayModeBar: false}}

  })

  const chartMonthlyDiurnals = computed(() => {

    var data = windCalmonthlyHours.map((month, month_no)=>{
      return {
        y:month.map(v=>v.meanHourlyCapFactor),
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.wind[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:false,  name: 'Wind ' + months[month_no]
      }
      })

      data = data.concat(solarCalmonthlyHours.map((month, month_no) => {
      return {
        y:month.map(v=>v.meanHourlyCapFactor),
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.solar[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:false,  name: 'Solar ' + months[month_no]
      }
    }))

    var layout = {
      height: 290,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 70,r: 5,b: 45,t: 0},
      xaxis: { title: 'Hour',
        showgrid: true, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Output',
        showgrid: true, zeroline: false, tickformat: '0%', ticks:'outside'
      }
    }

    return {data, layout , config: {displayModeBar: false}}

    /*
    div.on('plotly_hover', d => {
      var curveNumber = d.points[0].curveNumber
      var vals = div.data.map((_, i) => i === curveNumber ? 1 : 0.2)
      plt.restyle(div, 'opacity', vals)
    })
    div.on('plotly_unhover', d => {
      var curveNumber = d.points[0].curveNumber
      var vals = div.data.map((_, i) => i === curveNumber ? 1 : 1)
      plt.restyle(div, 'opacity', vals)
    })
    */

  })

  const chartMeanDiurnalCFsForRatios = computed(() => {
    var data =[
      {
        y:combinationModels[10].combined_cfs[5],
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.combined[1],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:true,  name: `${format('.2f')(combinationModels[10].ratio)}MW solar per MW wind`
      },{
        y:optimumCombination.combined_cfs[5],
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.combined[4],width:4}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:true,  name: `${format('.2f')(optimumCombination.ratio)}MW solar per MW wind`
        },{
        y:combinationModels[90].combined_cfs[5],
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.combined[10],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:true,  name: `${format('.2f')(combinationModels[90].ratio)}MW solar per MW wind`
      }]

    var layout = {
      height: 270,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 70,r: 5,b: 45,t: 0},
      xaxis: { title: 'Hour',
        showgrid: true, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Output',
        showgrid: true, zeroline: false, tickformat: '0%', ticks:'outside', range:[0,1]
      }
    }

    return {data, layout , config: {displayModeBar: false}}

  })

  const chartMonthlyCombinedDiurnals = computed(() => {
    var dat = combinationModels[selectedRatio.value].combined_cfs
    var data =dat.map((month,month_no) => {
      return {
        y:month,
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.combined[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:true,  name: months[month_no]
      }
    })

    var layout = {
      height: 270,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 70,r: 5,b: 45,t: 0},
      xaxis: { title: 'Hour',
        showgrid: true, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Output',
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside', range:[0,1]
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  })

  const chartDailyStorageHoursByMonth = computed(() => {
    var dat = combinationModels[selectedRatio.value]
    var data = [     {
        x: [...Array(12).keys()].map(v=>v+1),
        y: dat.monthly_store,name: '',
        text: dat.monthly_store.map(v=>format('.2f')(v)),
        type: 'bar', mode: 'markers+text', hoverinfo: 'none', stackgroup:'one',
        showlegend:false, marker: {color: makeTrans(colors.combined[5],0.6)}, textposition:'inside'
      }]

    var layout = {
      height: 270,
      font: font, hovermode:'closest', barmode:'stack',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 50,r: 5,b: 30,t: 0},
      xaxis: {
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        showgrid: false, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Hours', dtick:0.2,
        showgrid: true, zeroline: false, tickformat: '.1f', ticks:'outside',range:[0,1.75]
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  })

  const chartAnnualStorageRange = computed(() => {
    var data = [
    {
      y: combinationModels.map(v=>v.store_range),
      x: combinationModels.map(v=>v.ratio),
      mode: 'lines', textposition: 'top',  line: {shape:'spline',color: colors.storage[2], width: 4 },
      marker: {size: 5},
      type: 'scatter', showlegend:false, name: ''
    } ]

    data=data.concat([{
      y:[optimumCombination.store_range],
      x:[optimumCombination.ratio],
      text: [format('.2f')(optimumCombination.ratio)],
      name:'Optimum ratio',textposition:'top-center',showlegend:false,
      mode:'markers+text',type:'scatter', hoverinfo:'none', marker:{size:15, color:'black'}
    }])

    var layout = {
      height: 220,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 50,r: 5,b: 45,t: 0},
      xaxis: { title:'Ratio solar : wind capacity',
        showgrid: true, zeroline: false,tickformat: '.1f', ticks:'outside',
      },
      yaxis: {
        title: 'Range, Hours',
        showgrid: true, zeroline: false, tickformat: '.1f', ticks:'outside',
      }
    }
    return {data, layout , config: {displayModeBar: false}}

    })

  const chartDailyStorageRequirement = computed(() => {
    var data =[...Array(12).keys()].map((month_no) => {
      return {
        y:combinationModels.map(v=>v.monthly_store[month_no]),
        x:combinationModels.map(v=>v.ratio),
        mode: 'lines', line: {shape:'spline',color: colors.storage[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:false,  name: months[month_no]
      }
    })
    data=data.concat([{
      y:combinationModels.map(v=>v.store_max),
      x:combinationModels.map(v=>v.ratio),
      text:combinationModels.map(v=>format('.2f')(v.store_max)),name:'Storage requirement',
      mode:'lines',type:'scatter', hoverinfo:'x+text', line:{shape:'spline', width:2.5, color:'red'}
    }])
    data=data.concat([{
      y:[optimumCombination.store_max],
      x:[optimumCombination.ratio],
      text: [format('.2f')(optimumCombination.ratio) + ','+ format('.1f')(optimumCombination.store_max)],
      name:'Optimum ratio',textposition:'top-center',showlegend:false,
      mode:'markers+text',type:'scatter', hoverinfo:'none', marker:{size:15, color:'black'}
    }])
    data=data.concat([{
    x:[combinationModels[selectedRatio.value].ratio,combinationModels[selectedRatio.value].ratio],
      y:[0,2.2], showlegend:false,
      mode:'lines',line:{width:1,color:'#555'}
    }])

    var layout = {
      height: 270,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 50,r: 5,b: 50,t: 0},
      xaxis: { title:'Ratio solar : wind capacity',
        showgrid: true, zeroline: false,tickformat: '.1f', ticks:'outside',
      },
      yaxis: {
        title: 'Hours',
        showgrid: true, zeroline: false, tickformat: '.1f', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  })
</script>

<template>
  <PresentationPage>
    <v-row :class="!smAndUp?'ma-0 pa-0':'pa-5'">
      <v-col cols="12">
        <h1>Diurnal firm power from Wind and Solar with Storage in Zambia</h1>
        Solar PV and to a lesser extent wind power both exhibit a strong diurnal production profile.
        Solar PV has zero output during the night and conversely wind speeds are, on average, higher during the night.
        This makes the combination of wind and solar with storage a very attractive option for providing firm power.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartWindSolarDiurnal" />
          <figcaption>Average hourly output for wind and solar in Zambia.</figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartWindSolarMonthly" />
          <figcaption>Average monthly output for wind and solar in Zambia.</figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartMonthlyDiurnals" />
          <figcaption>Average hourly output by month for wind (blues) and solar (yellows).</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        Because of these complimentary daily production profiles, combining the output of the two plants produces a much smoother diurnal power profile.
        Due to the seasonal nature of the output of the wind plant the effect of mixing the output of the two projects changes through the year.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartMeanDiurnalCFsForRatios" />
          <figcaption>Average output in June for a combined plant with various proportions of wind and solar capacity.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        The shape of the daily production profiles for the combined plant depend on the
        proportion of capacity provided by the two plants. The daily production profile for
        the combined plants will never be entirely flat.
      </v-col>
      <v-col cols="12">
        <v-row class="no-gutters">
          <v-col cols="12" sm="3" md="2">
            <span class="text-body-1"><b>Solar to wind capacity ratio: </b></span>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-slider v-model="selectedRatio" :max="99" :min="0" :step="1" class="align-center" hide-details>
              <template v-slot:append>
                <span><b>{{ format('.2f')(ratio) }}</b> MW Solar PV : MW Wind</span>
              </template>
            </v-slider>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        To produce completely consistent output, intraday storage capacity needs to be added to the system.
        This could be in the form of batteries or using hydro power reservoirs.
        The storage need not be co-located with either the wind or solar plants and if it was provided by hydro reservoirs then it almost certainly would not.
        There would be beneftis for co-locating storage with either the wind or solar plants (or both) including shared O&M resources,
         grid access and reduced transmission losses and costs.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart v-if="chartMonthlyCombinedDiurnals" :definition="chartMonthlyCombinedDiurnals" />
          <figcaption>
            Diurnal output by month for a combined plant with {{format('.2f')(ratio)}}MW solar per MW wind.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart v-if="chartDailyStorageHoursByMonth" :definition="chartDailyStorageHoursByMonth" />
          <figcaption>
          Daily storage required in hours by month to entirely flatten the average diurnal output of a combined
          plant with {{format('.2f')(ratio)}}MW solar per MW wind.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
         The amount of storage required to completely flatten the daily output of the combined plant depends on the relative proportion of capacity for the wind and
         solar plants and the month. Greater storage capacity is particularly needed in months where the wind plant has a higher diurnal range of output.
      </v-col>
      <v-col cols="12">
        To entirely flatten the dirunal output in every month then the storage capacity (in hours) must be sized for the month with the greatest
        storage requirement. For plant ratios with a high range in monthly storage requirement (between the month with the highest
         storage requirement and the month with the lowest) the storage will either be insufficient in some months or underutilised
          in some month. Both situations lead to inefficieny.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="9" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartAnnualStorageRange" />
          <figcaption>Range (maximum month to minimum month) of storage requirement to flatten the diurnal output of the combined plant by ratio of solar to wind capacity.</figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="9" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartDailyStorageRequirement" />
          <figcaption>Daily storage requirement by month and ratio of solar to wind capacity to flatten the diurnal for a combined plant.
            Maximum storage requirement for the year in red. Optimum ratio is {{format('.2f')(optimumCombination.ratio)}}MW solar per MW wind
            with {{format('.1f')(optimumCombination.store_max)}} hours of storage.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        The ratio of solar capacity to wind capacity that minimises the relative storage requirement (in hours) can be determined
        by plotting the storage required to completely flatten the diurnal output of the combined plant for a range of capacity
        ratios for each month. For the Unika and Ilute plants this shows that {{format('.2f')(optimumCombination.ratio)}}MW of solar per MW of
        wind capacity minimises the storage requirement at {{format('.1f')(optimumCombination.store_max)}} hours to flatten the average diurnal output.
      </v-col>
    </v-row>
  </PresentationPage>
</template>

