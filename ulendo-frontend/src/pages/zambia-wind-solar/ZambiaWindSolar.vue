<script setup>
  import {  inject, computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { groups, min, max, mean, sum } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const makeTrans = inject('makeTrans')
  const months = inject('months')

  import solarAnnualExceedance from '@/data/ilute/output/iluteAnnualExceedance.csv'
  import solarStatistics_raw from '@/data/ilute/output/iluteStatistics.csv'
  const solarStatistics = solarStatistics_raw[0]
  import solarYearly from '@/data/ilute/output/iluteYearly.csv'
  import solarCalmonthly from '@/data/ilute/output/iluteCalmonthly.csv'
  import solarCalmonthlyHours_raw from '@/data/ilute/output/iluteCalmonthlyHours.csv'
  const solarCalmonthlyHours = groups(solarCalmonthlyHours_raw, d => d.month).map(v=>v[1])

  import windAnnualExceedance from '@/data/unika/output/unikaAnnualExceedance.csv'
  import windStatistics_raw from '@/data/unika/output/unikaStatistics.csv'
  const windStatistics=windStatistics_raw[0]
  import windYearly from '@/data/unika/output/unikaYearly.csv'
  import windCalmonthly from '@/data/unika/output/unikaCalmonthly.csv'
  import windCalmonthlyHours_raw from '@/data/unika/output/unikaCalmonthlyHours.csv'
  const windCalmonthlyHours = groups(windCalmonthlyHours_raw, d => d.month).map(v=>v[1])

  import dailyCapFactorFeb2019 from '@/data/zambia_wind_solar/output/dailyCapFactorFeb2019.csv'
  import hourlyCapFactorFeb2019 from '@/data/zambia_wind_solar/output/hourlyCapFactorFeb2019.csv'
  import dailyCapFactorJune2019 from '@/data/zambia_wind_solar/output/dailyCapFactorJune2019.csv'
  import hourlyCapFactorJune2019 from '@/data/zambia_wind_solar/output/hourlyCapFactorJune2019.csv'

  import vicfallsCalmonthly from '@/data/kariba/output/vicfallsCalmonthly.csv'

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

  const specificCapitalCost = { // $m per MW
    solar: 1.5,
    wind: 2,
    hydro: 3.5
  }

  const specificCapitalCostOfAnnualEnergy = {
    solar: (specificCapitalCost.solar*1000000) / (solarStatistics.medianAnualSpecificYield), //$/GWh/year
    wind: (specificCapitalCost.wind*1000000) / (windStatistics.medianAnualSpecificYield), //$/GWh/year
  }

  function chartRelativeYieldExceedance() {
    var data = [
      {
        x: solarAnnualExceedance.map(v => v.exceedance),
        y: solarAnnualExceedance.map(v => v.normalisedSpecificYield),
        type: 'scatter', showlegend:true, hoverinfo:'x+y',name:'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.solar[1]}
      }, {
        x: windAnnualExceedance.map(v => v.exceedance),
        y: windAnnualExceedance.map(v => v.normalisedSpecificYield),
        type: 'scatter', showlegend:true, hoverinfo:'x+y',name:'Wind',
        mode:'lines', line: {shape: '',width:3.5, color: colors.wind[1]}
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
        range:[min(windAnnualExceedance,v=>v.normalisedSpecificYield),max(windAnnualExceedance,v=>v.normalisedSpecificYield)],
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartYieldExceedance() {
    var data = [
      {
        x: solarAnnualExceedance.map(v => v.exceedance),
        y: solarAnnualExceedance.map(v => v.specificYield/1000),
        type: 'scatter', showlegend:true, hoverinfo:'x+y',name: 'Solar',
        mode:'lines', line: {shape: '',width:3.5, color: colors.solar[1]}
      },{
        text: [format(',.2f')(solarStatistics.medianAnualSpecificYield/1000) + ' GWh/MW/year'],
        x: [0.5],
        y: [solarStatistics.medianAnualSpecificYield/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        x: windAnnualExceedance.map(v => v.exceedance),
        y: windAnnualExceedance.map(v => v.specificYield/1000),
        type: 'scatter', showlegend:true, hoverinfo:'x+y', name: 'Wind',
        mode:'lines', line: {shape: '',width:3.5, color: colors.wind[1]}
      },{
        text: [format(',.2f')(windStatistics.medianAnualSpecificYield/1000) + ' GWh/MW/year'],
        x: [0.5],
        y: [windStatistics.medianAnualSpecificYield/1000],
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

  function chartRelativeAnnualYield() {

    var data = [
      {

        y: solarYearly.filter((v,i)=>i<20).map(v=>v.normalisedSpecificYield),
        type: 'bar', showlegend:true, name: 'Solar',
        mode:'lines', marker: {color: makeTrans(colors.solar[1],0.7)}
      },{

        y: windYearly.filter((v,i)=>i<20).map(v=>v.normalisedSpecificYield),
        type: 'bar', showlegend:true, name: 'Wind',
        mode:'lines', marker: {color: makeTrans(colors.wind[1],0.7)}
      }]

    var layout = {
      height: 300,
      showlegend: true, legend: {xanchor: 'left', x:-0.1, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 40,t: 10}, font:font,
      xaxis: {
        title:'Year',showgrid: false,zeroline: false,ticks:'outside',
      },
      yaxis: {
        title: '% of median',
        range:[0.8,1.02],
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside',
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartMonthlyEnergyPerCalMonth() {

  var data = [
    {
      x: solarCalmonthly.map(v=>v.month),
      y: solarCalmonthly.map(v=>v.p90MonthlySpecificYield),
      type: 'scatter', showlegend:false,
      mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
    },{
      x: solarCalmonthly.map(v=>v.month),
      y: solarCalmonthly.map(v=>v.p10MonthlySpecificYield),
      type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
      mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
    },{
      x: solarCalmonthly.map(v=>v.month),
      y: solarCalmonthly.map(v=>v.medianMonthlySpecificYield),
      type: 'scatter', showlegend:true, name: 'Solar',
      mode:'lines', line: {shape: 'spline',width:1.5, color: colors.solar[1], dash:''}
    },    {
      x: windCalmonthly.map(v=>v.month),
      y: windCalmonthly.map(v=>v.p90MonthlySpecificYield),
      type: 'scatter', showlegend:false,
      mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
    },{
      x: windCalmonthly.map(v=>v.month),
      y: windCalmonthly.map(v=>v.p10MonthlySpecificYield),
      type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
      mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
    },{
      x: windCalmonthly.map(v=>v.month),
      y: windCalmonthly.map(v=>v.medianMonthlySpecificYield),
      type: 'scatter', showlegend:true, name: 'Wind',
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
      title: 'Monthly Energy MWh/MW',
      showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

    }
  }
  return {data, layout , config: {displayModeBar: false}}
  }

  function chartDailyEnergyPerCalMonth() {
    var data = [
      {
        x: solarCalmonthly.map(v=>v.month),
        y: solarCalmonthly.map(v=>v.p90DailySpecificYield),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: solarCalmonthly.map(v=>v.month),
        y: solarCalmonthly.map(v=>v.p10DailySpecificYield),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: solarCalmonthly.map(v=>v.month),
        y: solarCalmonthly.map(v=>v.medianDailySpecificYield),
        type: 'scatter', showlegend:true, name: 'Solar',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.solar[1], dash:''}
      }, {
        x: windCalmonthly.map(v=>v.month),
        y: windCalmonthly.map(v=>v.p90DailySpecificYield),
        type: 'scatter', showlegend:false, name: 'P90',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: windCalmonthly.map(v=>v.month),
        y: windCalmonthly.map(v=>v.p10DailySpecificYield),
        type: 'scatter', showlegend:false,fill:'tonexty', name: 'P90-P10 Range',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: windCalmonthly.map(v=>v.month),
        y: windCalmonthly.map(v=>v.medianDailySpecificYield),
        type: 'scatter', showlegend:true, name: 'Wind',
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
        title: 'Daily Energy MWh/MW',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',

      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartWindVicFalls() {

    var data = [
      {
        y: vicfallsCalmonthly.map(month=>month.flow),
        text: vicfallsCalmonthly.map(month=>format(',.0f')(month.flow) + `m\u00b3/s`),
        x: vicfallsCalmonthly.map(month=>month.month),
        yaxis: 'y2',  hoverinfo: 'x+text',
        textposition: 'none',
        name:'Mean Flow at Victoria Falls',
        marker: {color: makeTrans(colors.combined[4],0.5)},
        type: 'bar'
      }, {
        x: windCalmonthly.map(v=>v.month),
        y: windCalmonthly.map(v=>v.p90MonthlySpecificYield),
        type: 'scatter', showlegend:false, hoverinfo:'none',
        mode:'lines', line: {shape: 'spline',width:0, color: '#BBB'}
      },{
        x: windCalmonthly.map(v=>v.month),
        y: windCalmonthly.map(v=>v.p10MonthlySpecificYield), hoverinfo:'none',
        type: 'scatter', showlegend:false,fill:'tonexty',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: windCalmonthly.map(v=>v.month),
        text: windCalmonthly.map(v=>format(',.0f')(v.medianMonthlySpecificYield) + ' MWh/MW'),
        y: windCalmonthly.map(v=>v.medianMonthlySpecificYield),
        type: 'scatter', showlegend:true, name: 'Wind', hoverinfo:'text',
        mode:'lines', line: {shape: 'spline',width:1.5, color: colors.wind[1], dash:''}
      }]

    var layout = {
      height: 300, font: font, showlegend: true,
      margin: {t:5,b:50,l:50,r:60}, barmode:'stack',
      legend: {orientation: 'h', x: 0, xanchor: 'left', y: -0.15},
      xaxis: {
        showgrid: false, zeroline: false, ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      },
      yaxis: {
        title: 'Monthly Energy MWh/MW',
        zeroline: false, showline: false, showgrid:false,
      },
        yaxis2: {
          title: 'Flow (m\u00B3/s)',
          zeroline: false, showline: false, showgrid:false,overlaying: 'y',
          separatethousands:true, side: 'right'
        }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartDiurnalByMonth(indx) {
    var data = [{
      y:solarCalmonthlyHours[indx].map(v=>v.p90HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:solarCalmonthlyHours[indx].map(v=>v.p10HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:solarCalmonthlyHours[indx].map(v=>v.meanHourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.9),width:1.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:windCalmonthlyHours[indx].map(v=>v.p90HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:windCalmonthlyHours[indx].map(v=>v.p10HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:windCalmonthlyHours[indx].map(v=>v.meanHourlyCapFactor),
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
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'none',
        showticklabels:indx==0,showticks:false, range: [-0.01,1.04]
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function hourlyDailyChart(hourly, daily)
  {
    var data = [{
        x: hourly.map(v=>v.date),
        y: hourly.map(v=>v.solar_capFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none',name:'Hourly output', fill:'',
        mode:'lines', line: {shape: 'spline', width:2, color: colors.solar[1]}
    },{
        x: hourly.map(v=>v.date),
        y: hourly.map(v=>v.wind_capFactor),
        type: 'scatter', showlegend:true, hoverinfo:'none',name:'Hourly output', fill:'',
        mode:'lines', line: {shape: 'spline', width:2, color: colors.wind[1]}
    },{
        x: daily.map(v=>v.date),
        y: daily.map(v=>v.solar_dailyCapFactor),
        type: 'bar', showlegend:true, hoverinfo:'y',name:'Daily yield, % of maximum for month',
        marker: {color: makeTrans(colors.solar[1],0.3)}
    },{
        x: daily.map(v=>v.date),
        y: daily.map(v=>v.wind_dailyCapFactor),
        type: 'bar', showlegend:true, hoverinfo:'y',name:'Daily yield, % of maximum for month',
        marker: {color: makeTrans(colors.wind[1],0.3)}
    }]

    var layout = {
      height: 350,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 5,b: 30,t: 10}, font:font,barmode:'',
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
      },
      yaxis: {
        title: 'Output',
        showgrid: true, zeroline: false, tickformat: '.0%', ticks:'outside',
      }
    }
    return {data, layout, config: {displayModeBar: false}}
  }

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
        <h1>Comparison of Zambian wind and solar yield characteristics</h1>
        Zambia has significant potential for new renewable energy generation particularly from Solar PV and Wind plants.
        However, both wind and solar plants are variable, intermittent energy sources meaning their output varies over all
        timescales from minute-to-minute all the way up to annual, seasonal variability. Understanding this variability and
        intermittency is critical to understanding how these energy sources can be combined to provide stable reliable generation.
        <br><br>
        Intermittency in wind and solar is caused by unpredictable, rapid - over seconds, minutes and hours - changes in
        the underlying energy resource - ie the wind speed and the solar irradiation due to cloud cover.
        Intermittency can be smoothed (although never eliminated) using relatively small capacity energy storage systems
        including chemical batteries or by using short-term capacity reserves from other generators on the grid.
        <br><br>
        Variability refers to cyclic patterns in the underlying energy resource at various timescales from annual,
        seasonal patterns through to daily, diurnal variability. Solar generation has very obvious diurnal variability
        with zero generation throughout the night rising gradualy to peak generation at midday. However, wind generation in
        Zambia also has a strong diurnal variability with higher generation at night. Wind and, to a lesser extent, solar also
        show annual, seasonal variability.
        <br><br>
        Diurnal variability in solar can be balanced using larger energy storage systems including chemical batteries
        but this has a significant cost. Diurnal and seasonal variability in wind and solar can more efficienty be
        balanced using other grid connected power generators, in particular in Zambia storage hydro. However, the diurnal
        variability of solar PV and wind in Zambia are complimentary with most of the wind resource falling at night when
        there is no solar output. An optimum ratio of Solar PV to Wind capacity of 0.34MW:1.00MW solar:wind gives the lowest
        average diurnal variation in output over the year.
        <br><br>
        Variability and intermittency in wind and solar resources are not independent of each other. Solar irradiation, for
        example, is higher in the summer months but in Zambia this also corresponds with the annual rainy season which leads to
        much higher intermittency due to cloud cover. The overall impact is very similar average monthly production but much
        higher variation in hourly and daily output.
        <br><br>
        <i style="font-size: small;">
          This analysis uses hourly yield models for a planned grid connected solar PV plant in Western Zambia and a planned
          grid connected wind farm in the Eastern Province of Zambia. In both cases the yield models use measured weather
          conditions (temperature, cloud cover, wind speed) over 20 years derived from remote, satellite measurements.
          For the Eastern Province wind farm site the data is validated using measurements from instruments on a met-mast
          operated at the project site since 2019.
        </i>
        <br><br>
        <h3>Annual Energy</h3>
        Both solar PV and wind plants provide stable, consistent output on an annual basis as shown by the very
        flat annual energy exceedance probability charts for the two types of generation.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartRelativeYieldExceedance()" />
          <figcaption>
          Annual nergy production annual exceedance for Zambian wind and solar plants relative to the median annual output.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartYieldExceedance()" />
          <figcaption>
          Annual energy production exceedance for Zambian wind and solar plants per MW installed.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartRelativeAnnualYield()" />
          <figcaption>Modelled relative annual output of Zambian wind and solar plants over a 20 year period based on
            measured historic weather conditions.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        At {{format(',.1f')(windStatistics.medianAnualSpecificYield/1000) + ' GWh/MW/year'}}, wind
        provides {{format(',.0%')((windStatistics.medianAnualSpecificYield-solarStatistics.medianAnualSpecificYield)/solarStatistics.medianAnualSpecificYield)}}
        more energy on an annual basis than the same capacity of solar generation
        at {{format(',.1f')(solarStatistics.medianAnualSpecificYield/1000) + ' GWh/MW/year'}}.
        <br/><br/>
        However, wind capacity has a higer capital cost - approx.
        {{'$' + format(',.1f')(specificCapitalCost.wind) + ' million/MW'}} - than solar at
        approx. {{'$' + format(',.1f')(specificCapitalCost.solar) + ' million/MW'}}.

        Adjusting for the difference in capital cost of the two types of generation shows that wind capacity is
        {{format(',.0%')((specificCapitalCostOfAnnualEnergy.wind-specificCapitalCostOfAnnualEnergy.solar)/specificCapitalCostOfAnnualEnergy.solar)}}
         more expensive tha annual solar generation at
         {{ '$' + format(',.0f')(specificCapitalCostOfAnnualEnergy.solar) + 'capital/GWh/year'}} for solar
         compared to {{ '$' + format(',.0f')(specificCapitalCostOfAnnualEnergy.wind) + 'capital/GWh/year'}} for wind generation.
        <br/><br/>
        However, despite being marginally more capital intensive on an annual energy basis than solar generation,
        wind power has better yield characteristics at shorter timeframes, most obviously on a daily, diurnal basis
        where wind generation is highest at night when solar generation is zero.
      </v-col>
      <v-col cols="12">
        <h3>Monthly and Daily Yield - Seasonality</h3>
        Zambian wind and solar plants show very different seasonal patterns of production driven by
        differing aspects of seasonal climatic conditions.
        <br><br>
        Solar seasonality in monthly yield is relatively small varying from an average of 227 MWh/MW of
        capacity during the rainy season in February to 280 MWh/MW in August. By contrast, wind yield is
        strongly seasonal with average monthly yield of 81 MWh/MW in rainy season January rising to 467 MWh/MW
        in dry season July.
        <br><br>
        A similar pattern is also evident in the average daily yield over the seasons. However, as would be
        expected, the relative variation in daily output is significantly higher than the relative variation in
        monthly output and also shows a significant seasonality. This is particularly true for the yield from wind
        generation. The variation in daily output for solar plants is highest during the summer, rainy season, from
        November to March where cloudy conditions can significantly curtail daily output.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyEnergyPerCalMonth()" />
          <figcaption>
          Monthly average energy yield - solid line - and P90 to P10 range of energy
          yield (filled area) by calendar month for Zambian wind and solar plants.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border ml-2 pl-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartDailyEnergyPerCalMonth()" />
          <figcaption>
          Daily average energy yield - solid line - and P90 to P10 range of energy
          yield (filled area) by calendar month for Zambian wind and solar plants.
        </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        Seasonality in average monthly yield from Zambian wind plants provide a useful hedge for the
        seasonal variation in river flow and consequent seasonal pressure on hydroelectric plants - which
        remain the dominant form of electricity generaiton in Zambia. Average wind yield reaches a peak from May
        through to September which corresponds to reducing river flows and reservoir inflows. This period also
        corresponds to most of the peak period of agricultural irrigation in Zambia.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartWindVicFalls()" />
          <figcaption>Average flow on the Zambezi River at Victoria Falls compared to average monthly  energy yield for a Zambian wind plant.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h3>Diurnal (hourly) Yield</h3>
        Comparison of the diurnal yield profile for each month for wind and solar plants show how the differing
        seasonaility in the underlying resources impact on the diurnal yields.
        <br><br>
        Average hourly output for solar PV is relatively constant throughout the year, however,
        from November through to March solar PV has much more variability in hourly output driven by the annual
        rainy season, increased cloud cover and increased intermittency.
        <br><br>
      </v-col>
      <v-col :key="mon" v-for="mon in Array.from(new Array(12), (x,i) => i)" cols="12" sm="6" md="4">
        <PlotlyChart :definition="chartDiurnalByMonth(mon)" />
      </v-col>
      <v-col cols="12">
        <figcaption>Average (line) and P90-P10 range (area) diurnal capacity factor by calendar month for a Zambian solar and wind plants.</figcaption>
      </v-col>
      <v-col cols="12">
        Examples of simulated performance of wind and solar PV plants for two 10 day periods in 2019 show the
        intermittency that both types of generation can experience. Intermittency in solar PV is simply caused
        by cloud cover - which in Zambia is almost entirely restricted to the rainy season between November and March.
        Dry season output, for example in June, is far more consistent for both solar PV and wind.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="hourlyDailyChart(hourlyCapFactorFeb2019, dailyCapFactorFeb2019)" />
          <figcaption>Simulated hourly and daily output over 10 days in February 2019 for Zambian solar and wind plants.</figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="hourlyDailyChart(hourlyCapFactorJune2019, dailyCapFactorJune2019)" />
          <figcaption>Simulated hourly and daily output over 10 days in June 2019 for Zambian solar and wind plants.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <h3>Firm diurnal by combining wind and solar</h3>
        Because Zambian solar PV and wind plants have complimentary daily, diurnal output profiles mixing generation
        from the two sources can produce a firmer, more constant diurnal production profile.

        It can be shown that the optimum ratio of solar PV to wind capacity for the firmest, most constant diurnal throughout the
        year is {{format('.2f')(optimumCombination.ratio)}}MW:1.00MW solar:wind. <RouterLink to="/zambia-wind-solar-storage-firm-diurnal">See here for the analysis.</RouterLink>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartMeanDiurnalCFsForRatios" />
          <figcaption>Average output in June for a combined plant with various proportions of wind and solar capacity.</figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="12" md="9">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartMonthlyCombinedDiurnals" />
          <figcaption>Diurnal output by month for a combined plant with {{format('.2f')(ratio)}}MW solar per MW wind.</figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        It can also be shown that the minimum capacity of storage required to completely flatten the <i>average</i> diurnal
        output of a compbined wind and solar plant with a ratio of solar to
        wind capacity of {{format('.2f')(ratio)}}MW/MW is {{ format('.1f')(optimumCombination.store_max) }} hours of storage or {{ format('.1f')(optimumCombination.store_max) }}MWh / MW installed.
        Higher quantities of storage are required where other ratios of solar to wind are constructed.
        <br><br>
        It is important to realise that this storage is only designed to flatten the average diurnal output
        of the combined plants and not to smooth any intermittency due to cloud or still conditions.
        Considering the cloudy, still conditions can go on for many days, significantly more storage would be needed to smooth the intermittency.
        <br><br>
        Also, in Zambia there is very significant existing storage potential (battery capacity)
        in the hydroelectric reservoirs particularly at Kariba and to a lesser extent Itezi-tezi.
        New chemical batteries (eg Lithium polymer) will be considerably more expensive than this legacy hydroelectric capacity.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" sm="9" md="6">
        <v-sheet class="border ma-0 pa-0">
          <PlotlyChart :definition="chartDailyStorageRequirement" />
          <figcaption>Daily storage requirement by month and ratio of solar to wind capacity to flatten the diurnal for a combined plant.
            Maximum storage requirement for the year in red. Optimum ratio is {{format('.2f')(optimumCombination.ratio)}}MW solar per MW wind
            with {{format('.1f')(optimumCombination.store_max)}} hours of storage.</figcaption>
        </v-sheet>
      </v-col>
    </v-row>
  </PresentationPage>
</template>
