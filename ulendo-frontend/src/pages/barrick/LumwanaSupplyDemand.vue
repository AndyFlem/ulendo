<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import { min, max, groups,sum, mean, quantile } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const makeTrans = inject('makeTrans')
  const months = inject('months')
  const monthDays=[31,28,31,30,31,30,31,31,30,31,30,31]

  import lumwanaDemand from '@/data/barrick/output/lumwanaDemand.csv'
  import unikaStatistics_raw from '@/data/unika2/output/unikaStatistics.csv'
  const unikaStatistics = unikaStatistics_raw[0]
  import kalumbilaAnnualExceedance from '@/data/kalumbila/output/kalumbilaAnnualExceedance.csv'
  import unikaAnnualExceedance from '@/data/unika2/output/unikaAnnualExceedance.csv'
  import kalumbilaStatistics_raw from '@/data/kalumbila/output/kalumbilaStatistics.csv'
  const kalumbilaStatistics = kalumbilaStatistics_raw[0]
  import unikaYearly from '@/data/unika2/output/unikaYearly.csv'
  import kalumbilaYearly from '@/data/kalumbila/output/kalumbilaYearly.csv'
  import unikaMonthly from '@/data/unika2/output/unikaMonthly.csv'
  import kalumbilaMonthly from '@/data/kalumbila/output/kalumbilaMonthly.csv'
  import unikaCalmonthly from '@/data/unika2/output/unikaCalmonthly.csv'
  import kalumbilaCalmonthly from '@/data/kalumbila/output/kalumbilaCalmonthly.csv'
  //import unikaDiurnal from '@/data/unika2/output/unikaDiurnal.csv'
  //import kalumbilaDiurnal from '@/data/kalumbila/output/kalumbilaDiurnal.csv'
  import kalumbilaCalmonthlyHours_raw from '@/data/kalumbila/output/kalumbilaCalmonthlyHours.csv'
  const kalumbilaCalmonthlyHours = groups(kalumbilaCalmonthlyHours_raw, d => d.month).map(v=>v[1])
  import unikaCalmonthlyHours_raw from '@/data/unika2/output/unikaCalmonthlyHours.csv'
  const unikaCalmonthlyHours = groups(unikaCalmonthlyHours_raw, d => d.month).map(v=>v[1])

  import mixedCalmonthly from '@/data/barrick/output/combinedCalmonthly.csv'


  import solarMixedCalmonthly_raw from '@/data/solar_mixing/output/SolarMixingCalmonthly.csv'
  const solarMixedCalmonthly=groups(solarMixedCalmonthly_raw, d => d.site1Scale).map(v=>v[1])


  const combinedAnnualExceedance = unikaAnnualExceedance.map((v,i) => {
    return {
      exceedance: v.exceedance,
      energyMWh: v.energyMWh + kalumbilaAnnualExceedance[i].energyMWh
    }
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
        ((kalumbilaCalmonthlyHours[month_no][hour_no].meanHourlyCapFactor * ratio.ratio) + unikaCalmonthlyHours[month_no][hour_no].meanHourlyCapFactor) / (1+ratio.ratio))
      })
      ratio.monthly_av_cfs = [...Array(12).keys()].map(month_no=>{
        return mean(ratio.combined_cfs[month_no])
      })
      ratio.monthly_max_cfs = [...Array(12).keys()].map(month_no=>{
        return max(ratio.combined_cfs[month_no])
      })
      ratio.monthly_p75_cfs = [...Array(12).keys()].map(month_no=>{
        return quantile(ratio.combined_cfs[month_no],0.75)
      })
      ratio.monthly_p90_cfs = [...Array(12).keys()].map(month_no=>{
        return quantile(ratio.combined_cfs[month_no],0.90)
      })

      ratio.monthly_store = [...Array(12).keys()].map(month_no=>{
        return sum(ratio.combined_cfs[month_no].map(v=>v>ratio.monthly_av_cfs[month_no]?v-ratio.monthly_av_cfs[month_no]:0))
      })
      ratio.monthly_store_tomax = [...Array(12).keys()].map(month_no=>{
        return sum(ratio.combined_cfs[month_no].map(v=>ratio.monthly_max_cfs[month_no]-v))
      })
      ratio.monthly_store_top75 = [...Array(12).keys()].map(month_no=>{
        return sum(ratio.combined_cfs[month_no].map(v=>v<ratio.monthly_p75_cfs[month_no]?ratio.monthly_p75_cfs[month_no]-v:0))
      })
      ratio.monthly_store_top90 = [...Array(12).keys()].map(month_no=>{
        return sum(ratio.combined_cfs[month_no].map(v=>v<ratio.monthly_p90_cfs[month_no]?ratio.monthly_p90_cfs[month_no]-v:0))
      })

      ratio.store_hours = [...Array(12).keys()].map(month_no=>{
        return ratio.combined_cfs[month_no].filter(v=>v>ratio.monthly_av_cfs[month_no]).length
      })
      ratio.store_max = max(ratio.monthly_store)
      ratio.store_range = max(ratio.monthly_store) - min(ratio.monthly_store)

      ratio.annual_store_tomean_total = sum(ratio.monthly_store.map((v,i)=>v*monthDays[i]))
      ratio.annual_store_tomax_total = sum(ratio.monthly_store_tomax.map((v,i)=>v*monthDays[i]))
      ratio.annual_store_top75_total = sum(ratio.monthly_store_top75.map((v,i)=>v*monthDays[i]))
      ratio.annual_store_top90_total = sum(ratio.monthly_store_top90.map((v,i)=>v*monthDays[i]))

      return ratio
    })

    return ret
  })()
  const optimumCombination=combinationModels.filter(w=>w.store_max==min(combinationModels.map(v=>v.store_max)))[0]

  const yearlyoffSet = kalumbilaYearly.length-unikaYearly.length
  const combinedYearly = unikaYearly.map((v,i) => {
    return {
      year: v.year,
      solarEnergyMWh: kalumbilaYearly[i+yearlyoffSet].energyMWh,
      windEnergyMWh: v.energyMWh,
      energyMWh: v.energyMWh + kalumbilaYearly[i+yearlyoffSet].energyMWh
    }
  })

  const monthlyoffSet = kalumbilaMonthly.length-unikaMonthly.length
  const combinedMonthly = unikaMonthly.map((v,i) => {
    return {
      datetime: v.datetime,
      solarEnergyMWh: kalumbilaMonthly[i+monthlyoffSet].energyMWh,
      windEnergyMWh: v.energyMWh,
      energyMWh: v.energyMWh + kalumbilaMonthly[i+monthlyoffSet].energyMWh
    }
  })

  const combinedCalmonthly = unikaCalmonthly.map((v,i) => {
    return {
      month: v.month,
      solarMeanDailyEnergyMWh: kalumbilaCalmonthly[i].meanDailyEnergyMWh,
      solarP90DailyEnergyMWh: kalumbilaCalmonthly[i].p90DailyEnergyMWh,
      solarP10DailyEnergyMWh: kalumbilaCalmonthly[i].p10DailyEnergyMWh,

      windMeanDailyEnergyMWh: v.meanDailyEnergyMWh,
      windP90DailyEnergyMWh: unikaCalmonthly[i].p90DailyEnergyMWh,
      windP10DailyEnergyMWh: unikaCalmonthly[i].p10DailyEnergyMWh,

      meanDailyEnergyMWh: v.meanDailyEnergyMWh + kalumbilaCalmonthly[i].meanDailyEnergyMWh,
      p90DailyEnergyMWh: v.p90DailyEnergyMWh + kalumbilaCalmonthly[i].p90DailyEnergyMWh,
      p10DailyEnergyMWh: v.p10DailyEnergyMWh + kalumbilaCalmonthly[i].p10DailyEnergyMWh,

      solarMeanMonthlyEnergyMWh: kalumbilaCalmonthly[i].meanMonthlyEnergyMWh,
      solarP90MonthlyEnergyMWh: kalumbilaCalmonthly[i].p90MonthlyEnergyMWh,
      solarP10MonthlyEnergyMWh: kalumbilaCalmonthly[i].p10MonthlyEnergyMWh,

      windMeanMonthlyEnergyMWh: v.meanMonthlyEnergyMWh,
      windP90MonthlyEnergyMWh: unikaCalmonthly[i].p90MonthlyEnergyMWh,
      windP10MonthlyEnergyMWh: unikaCalmonthly[i].p10MonthlyEnergyMWh,

      meanMonthlyEnergyMWh: v.meanMonthlyEnergyMWh + kalumbilaCalmonthly[i].meanMonthlyEnergyMWh,
      p90MonthlyEnergyMWh: v.p90MonthlyEnergyMWh + kalumbilaCalmonthly[i].p90MonthlyEnergyMWh,
      p10MonthlyEnergyMWh: v.p10MonthlyEnergyMWh + kalumbilaCalmonthly[i].p10MonthlyEnergyMWh
    }
  })

  const combinedCalmonthlyHours = unikaCalmonthlyHours.map((month, m) => {
    return month.map((hr, h) => {
      return {
        month: hr.month,
        hour: hr.hour,
        meanHourlyEnergyMWh: hr.meanHourlyEnergyMWh + kalumbilaCalmonthlyHours[m][h].meanHourlyEnergyMWh,
        p90HourlyEnergyMWh: hr.p90HourlyEnergyMWh + kalumbilaCalmonthlyHours[m][h].p90HourlyEnergyMWh,
        p10HourlyEnergyMWh: hr.p10HourlyEnergyMWh + kalumbilaCalmonthlyHours[m][h].p10HourlyEnergyMWh
      }
    })
  })

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

  function chartAnnualYieldExceedance() {
    var data = [
    {
        x: combinedAnnualExceedance.map(v => v.exceedance),
        y: combinedAnnualExceedance.map(v => v.energyMWh/1000),
        type: 'scatter', showlegend:false, hoverinfo:'x+y',name: 'Combined plant',
        mode:'lines', line: {shape: '',width:3.5, color: colors.combined[1]}
      },{
        text: ['P50 - ' + format(',.1f')(combinedAnnualExceedance[5].energyMWh/1000) + ' GWh/year'],
        x: [0.5],
        y: [combinedAnnualExceedance[5].energyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'bottomright',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P10 - ' + format(',.1f')(combinedAnnualExceedance[1].energyMWh/1000) + ' GWh/year'],
        x: [0.1],
        y: [combinedAnnualExceedance[1].energyMWh/1000],
        type: 'scatter', showlegend:false,hoverinfo:'y',textposition:'left',
        mode:'markers+text', marker:{size:10, color:'#666'}
      },{
        text: ['P90 - ' + format(',.1f')(combinedAnnualExceedance[9].energyMWh/1000) + ' GWh/year'],
        x: [0.9],
        y: [combinedAnnualExceedance[9].energyMWh/1000],
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

  /*
  function chartKalumbilaAnnualYieldExceedance() {
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

  function chartUnikaAnnualYieldExceedance() {
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
  */

  function chartCombinedAnnual() {

    var data = [
      {
        x: combinedYearly.map(v=>v.year),
        y: combinedYearly.map(v=>v.solarEnergyMWh/1000),
        type: 'bar', showlegend:true, name: 'Solar energy',
        marker: {color: makeTrans(colors.solar[1],0.6)}
      },{
        x: combinedYearly.map(v=>v.year),
        y: combinedYearly.map(v=>v.windEnergyMWh/1000),
        type: 'bar', showlegend:true, name: 'Wind energy',
        marker: {color: makeTrans(colors.wind[1],0.6)}
      },{
        x: combinedYearly.map(v=>v.year),
        y: combinedYearly.map(v=>v.energyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Combined energy',
        line: {shape:'spline', width:1.5, color: makeTrans(colors.combined[1],1)}
      },
      demand(19,''),
      demand(12,'dash'),
      demand(8, 'dot'),
      demand(5, 'dashdot'),
      demand(2, 'dash')]

  function demand(yearNo, dash) {
    return {
        x:[2002,2021], textposition:'left',
        y:[lumwanaDemand[yearNo].annualEnergyGWh,lumwanaDemand[yearNo].annualEnergyGWh],showlegend:false,
        text: [lumwanaDemand[yearNo].year,''],hoverinfo:'y',
        mode:'lines+text', name:'Demand ' + lumwanaDemand[yearNo].year, line:{color: colors.demand[7], width:1.5, dash:dash}
      }
  }

    var layout = {
      height: 350,
      barmode:'stack',
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
      xaxis: {
        showgrid: false,zeroline: false, ticks:'outside',
      },
      yaxis: {
        title: 'GWh',
        showgrid: true, zeroline: false, tickformat: ',.0f', ticks:'outside',
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCombinedMonthly() {

  var data = [
    {
      x: combinedMonthly.map(v=>v.datetime),
      y: combinedMonthly.map(v=>v.solarEnergyMWh/1000),
      type: 'bar', showlegend:true, name: 'Solar energy',
      marker: {color: makeTrans(colors.solar[1],0.6)}
    },{
      x: combinedMonthly.map(v=>v.datetime),
      y: combinedMonthly.map(v=>v.windEnergyMWh/1000),
      type: 'bar', showlegend:true, name: 'Wind energy',
      marker: {color: makeTrans(colors.wind[1],0.6)}
    },{
      x: combinedMonthly.map(v=>v.datetime),
      y: combinedMonthly.map(v=>v.energyMWh/1000),
      type: 'scatter', showlegend:true, name: 'Combined energy',
      line: {shape:'spline', width:1.5, color: makeTrans(colors.combined[1],1)}
    },
    demand(19,''),
    demand(12,'dash'),
    demand(8, 'dot'),
    demand(5, 'dashdot'),
    demand(2, 'dash')]

  function demand(yearNo, dash) {
    return {
      x:['2002-01-01','2021-12-30'], textposition:'left',
      y:[lumwanaDemand[yearNo].annualEnergyGWh/12,lumwanaDemand[yearNo].annualEnergyGWh/12],showlegend:false,
      text: [lumwanaDemand[yearNo].year,''],hoverinfo:'y',
      mode:'lines+text', name:'Demand ' + lumwanaDemand[yearNo].year, line:{color: colors.demand[7], width:1.5, dash:dash}
    }
  }

  var layout = {
    height: 350,
    barmode:'stack',
    showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
    margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
    xaxis: {
      showgrid: false,zeroline: false, ticks:'outside',
    },
    yaxis: {
      title: 'GWh',
      showgrid: true, zeroline: false, tickformat: ',.0f', ticks:'outside',
    }
  }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCalMonthlyYield() {
    var data = [
      {
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.meanMonthlyEnergyMWh/1000), hoverinfo:'y',
        type: 'scatter', showlegend:true, name: 'Combined Wind and Solar',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.combined[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.p90MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '',hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.combined[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.p10MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '', fill:'tonexty',hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.combined[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windMeanMonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Wind',hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.wind[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windP90MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '',hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windP10MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '', fill:'tonexty',hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[2]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarMeanMonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Solar', hoverinfo:'y',
        mode:'lines', line: {shape: 'spline',width:2, color: colors.solar[1]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarP90MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '', hoverinfo:'none',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarP10MonthlyEnergyMWh/1000),
        type: 'scatter', showlegend:false, name: '', fill:'tonexty', hoverinfo:'none',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },
      demand(19,''),
      demand(12,'dash'),
      demand(8, 'dot'),
      demand(5, 'dashdot'),
      demand(2, 'dash')]

    function demand(yearNo, dash) {
      return {
          x:[1.3,12], textposition:'left',
          y:[lumwanaDemand[yearNo].annualEnergyGWh/12,lumwanaDemand[yearNo].annualEnergyGWh/12],showlegend:false,
          text: [lumwanaDemand[yearNo].year,''],
          mode:'lines+text', name:'Demand ' + lumwanaDemand[yearNo].year, line:{color: colors.demand[7], width:1.5, dash:dash}
        }
    }

    var layout = {
      height: 370, barmode:'stack',
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.1, orientation:'h'},
      margin: {l: 70,r: 5,b: 10,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        range:[0.5,12.5]
      },
      yaxis: {
        title: 'GWh',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside',
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCalMonthlyDailyYield() {

    const data =  [
      {
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarP90DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,
        mode:'lines', line: {shape: 'spline',width:0}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarP10DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,fill:'tonexty',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.solar[1]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.solarMeanDailyEnergyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Solar',
        mode:'lines+markers', line: {shape: 'spline',width:2.5, color: colors.solar[1]}
      }, {
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windP90DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,
        mode:'lines', line: {shape: 'spline',width:0}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windP10DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,fill:'tonexty',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.wind[1]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.windMeanDailyEnergyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Wind',
        mode:'lines+markers', line: {shape: 'spline',width:2.5, color: colors.wind[1]}
      }]

    const layout = {
      height: 350,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        range:[0.5,12.5]
      },
      yaxis: {
        title: 'Energy GWh/day',
        showgrid: true, zeroline: false, tickformat: ',.1f', ticks:'none',
        range: [-0.01,lumwanaDemand[19].annualEnergyGWh/365*1.05]
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCalMonthlyDailyYieldCombined() {
    let data =  [
      {
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.p90DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,
        mode:'lines', line: {shape: 'spline',width:0}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.p10DailyEnergyMWh/1000),
        type: 'scatter', showlegend:false,fill:'tonexty',
        mode:'lines', line: {shape: 'spline',width:0, color: colors.combined[1]}
      },{
        x: combinedCalmonthly.map(v=>v.month),
        y: combinedCalmonthly.map(v=>v.meanDailyEnergyMWh/1000),
        type: 'scatter', showlegend:true, name: 'Combined',
        mode:'lines+markers', line: {shape: 'spline',width:2.5, color: colors.combined[1]}
      }]

      data = data.concat(demand(19,''))
      data = data.concat(demand(12,'dash'))
      data = data.concat(demand(8, 'dot'))
      data = data.concat(demand(5, 'dashdot'))
      data = data.concat(demand(2, 'dash'))

      function demand(yearNo, dash) {
        return {
            x:[1.6,12], textposition:'left',
            y:[lumwanaDemand[yearNo].annualEnergyGWh/365,lumwanaDemand[yearNo].annualEnergyGWh/365],showlegend:false,
            text: [lumwanaDemand[yearNo].year,''],
            mode:'lines+text', name:'Demand ' + lumwanaDemand[yearNo].year, line:{color: colors.demand[7], width:1.5, dash:dash}
          }
      }

    const layout = {
      height: 350,
      showlegend: true, legend: {xanchor: 'left', x:0, y: -0.2, orientation:'h'},
      margin: {l: 70,r: 20,b: 50,t: 10}, font:font,
      xaxis: {
        showgrid: false,
        zeroline: false,
        ticks:'outside',
        tickvals: [ 1,2,3,4,5,6,7,8,9,10,11,12 ],
        ticktext: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        range:[0.5,12.5]
      },
      yaxis: {
        title: 'Energy GWh/day',
        showgrid: true, zeroline: false, tickformat: ',.1f', ticks:'none',
        range: [-0.01,lumwanaDemand[19].annualEnergyGWh/365*1.05]
      }
    }

    return {data, layout , config: {displayModeBar: false}}
  }
/*
  function chartWindSolarDiurnal() {
    var data = [ {
      y: unikaDiurnal.map(v=>v.meanCapFactor),
      x: [...Array(24).keys()].map(v=>v+1),
      name: 'Wind',
      mode: 'lines',   line: {shape:'spline', width:2.5,color: colors.wind[1]},
      type: 'scatter', showlegend:true, hoverinfo:'x+y', textposition:'top-center'
    }, {
      y: kalumbilaDiurnal.map(v=>v.meanCapFactor),
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
  }
*/
  /*
  function chartMonthlyDiurnals() {

    var data = unikaCalmonthlyHours.map((month, month_no)=>{
      return {
        y:month.map(v=>v.meanHourlyCapFactor),
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.wind[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:month_no==0 || month_no==11,  name: 'Wind ' + months[month_no]
      }
    })

    data = data.concat(kalumbilaCalmonthlyHours.map((month, month_no) => {
    return {
      y:month.map(v=>v.meanHourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: colors.solar[month_no],width:2}, fill:'',
      type: 'scatter', hoverinfo: 'name', showlegend:month_no==0 || month_no==11,  name: 'Solar ' + months[month_no]
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
  }
    */
  function chartDiurnalByMonth(indx) {
    var data = [{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.p90HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.p10HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:kalumbilaCalmonthlyHours[indx].map(v=>v.meanHourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[indx],0.9),width:1.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:unikaCalmonthlyHours[indx].map(v=>v.p90HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:unikaCalmonthlyHours[indx].map(v=>v.p10HourlyCapFactor),
      x:[...Array(24).keys()],
      mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[indx],0.8),width:0.5}, fill:'tonexty',
      type: 'scatter', hoverinfo: 'none', showlegend:false,
    },{
      y:unikaCalmonthlyHours[indx].map(v=>v.meanHourlyCapFactor),
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

  function chartMeanDiurnalCFsForRatios() {
      var data =[
        {
          y:combinationModels[10].combined_cfs[5],
          x:[...Array(24).keys()],
          mode: 'lines', line: {shape:'spline',color: makeTrans(colors.wind[1],0.5),width:2}, fill:'',
          type: 'scatter', hoverinfo: 'name', showlegend:true,  name: `${format('.2f')(combinationModels[10].ratio)}MW solar per MW wind`
        },{
          y:optimumCombination.combined_cfs[5],
          x:[...Array(24).keys()],
          mode: 'lines', line: {shape:'spline',color: colors.combined[4],width:4}, fill:'',
          type: 'scatter', hoverinfo: 'name', showlegend:true,  name: `${format('.2f')(optimumCombination.ratio)}MW solar per MW wind`
        },{
          y:combinationModels[90].combined_cfs[5],
          x:[...Array(24).keys()],
          mode: 'lines', line: {shape:'spline',color: makeTrans(colors.solar[1],0.5),width:2}, fill:'',
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

  }

  function chartMonthlyDiurnalsforCombined() {
    var data = combinedCalmonthlyHours.map((month, month_no)=>{
      return {
        y:month.map(v=>v.meanHourlyEnergyMWh),
        x:[...Array(24).keys()],
        mode: 'lines', line: {shape:'spline',color: colors.combined[month_no],width:2}, fill:'',
        type: 'scatter', hoverinfo: 'name', showlegend:false,  name: months[month_no]
      }
    })

    var layout = {
      height: 300,
      font: font, hovermode:'closest',
      showlegend: true, legend: {orientation: 'h',xanchor: 'left', x:0, y: 1.1},
      margin: {l: 50,r: 5,b: 30,t: 0},
      xaxis: {
        showgrid: true, zeroline: false, ticks:'outside', dtick:1,
      },
      yaxis: {
        title: 'Energy MWh/hour',
        showgrid: true, zeroline: false, tickformat: '.0f', ticks:'outside'
      }
    }
    return {data, layout , config: {displayModeBar: false}}
  }

  function chartCombinedDailyIntermittency() {

  var data = [
    {
      x: kalumbilaCalmonthly.map(v=>v.month),
      y: kalumbilaCalmonthly.map(v=>v.coefVarDailyEnergy),
      type: 'scatter', showlegend:true, hoverinfo:'none',name: 'Solar',
      mode:'lines', line: {shape: 'spline',width:2, color: colors.solar[1]}
    },
    {
      x: unikaCalmonthly.map(v=>v.month),
      y: unikaCalmonthly.map(v=>v.coefVarDailyEnergy),
      type: 'scatter', showlegend:true, hoverinfo:'none', name:'Wind',
      mode:'lines', line: {shape: 'spline',width:2, color: colors.wind[1]}
    },{
      x: mixedCalmonthly.map(v=>v.month),
      y: mixedCalmonthly.map(v=>v.coefVarDailyEnergy),
      type: 'scatter', showlegend:true, hoverinfo:'none',name:'Combined wind and solar',
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

  function chartSolarCombinedDailyIntermittency() {

  var data = [
    {
      x: solarMixedCalmonthly[2].map(v=>v.month),
      y: solarMixedCalmonthly[2].map(v=>v.coefVarDailyCapFactor),
      type: 'scatter', showlegend:true, hoverinfo:'none',name: 'Sesheke Only',
      mode:'lines', line: {shape: 'spline',width:2, color: colors.storage[1]}
    },{
      x: solarMixedCalmonthly[0].map(v=>v.month),
      y: solarMixedCalmonthly[0].map(v=>v.coefVarDailyCapFactor),
      type: 'scatter', showlegend:true, hoverinfo:'none', name:'Solwezi Only',
      mode:'lines', line: {shape: 'spline',width:2, color: colors.solar[1]}
    },{
      x: solarMixedCalmonthly[1].map(v=>v.month),
      y: solarMixedCalmonthly[1].map(v=>v.coefVarDailyCapFactor),
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
        The challenge is to match the supply of renewable energy with the industrial demand and whilst, in Zambia, certain
        combinations of renewable energy
        sources can be complementary, medium and long-term smoothing and balancing services - either from
        the utility or the regional power market - are required to ensure a consistent supply.
        <br><br>
        This analysis considers the partial supply of the mine demand with variable renewable energy from a combination of
        the planned {{ unikaStatistics.capacity }}MW Mphepo Power - Unika II Wind Project and a nominal
        {{ kalumbilaStatistics.capacity }}MW Solar PV project near Solwezi in Zambia.
        <br><br>
        Whilst both wind and solar PV in Zambia provide reliable, consistent, baseload-like energy production at the longest
        timescales (year to year), at shorter timescales their variability (including seasonality and diurnal variation) are
        very different. At the daily timescale, Zambian wind and solar are complimentary with the highest wind yields at night
        when there is no solar output.
        <br><br>
        <a target="_blank" href="/zambia-wind-solar-storage-firm-diurnal">It can be shown</a> that a combination of approximately
        0.4MW of the solar PV to 1MW of wind capacity provides the most consistent combined daily output on average and this ratio
        has been used to set the solar capacity in this study to 50MW (~40% of 120MW Unika II Wind).
        <br><br>
        The overnight cost of solar PV energy (capital cost per unit annual generation) is around 11% lower than
        the comparible cost of Zambian wind energy, however, the very high diurnal variability of solar PV (no energy at night)
        makes a combined plant with 0.4MW PV per MW wind much more suited to baseload industrial offtake such as for mining operations.
        Adding more solar PV will require much greater quantities of expensive balancing energy to be provided either by batteries (BESS) or from
        the grid. For further details <a target="_blank" href="/zambia-wind-solar-storage-firm-diurnal">see here</a>.
        <br><br>
        A general comparison of the energy variability and intermittency of wind and solar PV project in Zambia can be
        over various timescales <a target="_blank" href="/zambia-wind-solar">can be found here,</a> and yield statistics
        for the two component projects can be seen at:
        <ul style="margin-left: 50px; margin-top: 5px; margin-bottom: 10px;">
          <li><a target="_blank" href="/unika/yield">Unika II Wind Project - Yield Analysis</a></li>
          <li><a target="_blank" href="/solwezi-pv-yield">Solar PV at Solwezi - Yield Analysis</a></li>
        </ul>

        A comparison of siting the solar PV plant at Solwezi, at Sesheke or
        split between the two locations can be found <a href="solar-comparison" target="_blank">here.</a>
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Annual Generation</span>
        <br>
        Both solar PV and wind energy in Zambia provide very reliable, consistent generation on an annual
        basis - acting as baseload.
        The combined Unika II and Solwezi PV plants would provide an average of {{ format(',.0f')(combinedAnnualExceedance[5].energyMWh/1000) + 'GWh/year' }}
        completely meeting the mine 2025 demand of {{ format(',.0f')(lumwanaDemand[2].annualEnergyGWh) }}GWh
        and around 50% of the 2042 demand of
        {{ format(',.0f')(lumwanaDemand[21].annualEnergyGWh) }}GWh.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCombinedAnnual()" />
          <figcaption>
            Simulated annual energy generation from the Unika II Wind Project and Solwezi Solar PV Project.
            Forecasted Lumwana mine demand for selected years is overlaid.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartAnnualYieldExceedance()" />
          <figcaption>
            Annual energy exceedance curves for the combined solar PV and wind plants showing the median annual energy yield of the
            plants is {{ format(',.0f')(combinedAnnualExceedance[5].energyMWh/1000) + 'GWh/year' }}, or {{ format(',.0f')(combinedAnnualExceedance[5].energyMWh/1000/12) + 'GWh/month' }}.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Monthly Generation</span>
        <br><br>
        At the monthly timescale the difference between generation from wind and solar PV becomes apparent.
        Wind generation shows significant seasonality with much higher output in the dry winter months
        and lower output during the rainy summer months. Solar output shows very little seasonality.
        Monthly wind generation is also much more variable from year to year compared to solar - as shown by the width of the
        P90-P10 bands in the seasonal generation chart. At the monthly timescale the solar PV generation
        continues to operate closer to baseload.
        <br><br>
        Because of the seasonality of the wind generation and therefore the combined output at the monthly timescale, the combined
        plant would be able to meet to the total demand of the plant at certain times of year upto the 2028 demand level. However,
        this would still require balancing with grid supplied energy to meet baseload demand. Battery storage would not be capable of
        provding the balancing energy at these timescales.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" lg="10" xl="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCombinedMonthly()" />
          <figcaption>
            Simulated monthly energy generation from the Unika II Wind Project and Solwezi Solar PV Project.
            Forecasted Lumwana mine demand for selected years is overlaid.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCalMonthlyYield()" />
          <figcaption>
            Monthly energy for the Unika II Wind Project and a solar PV plant at Solwezi as well as the combined output. Solid lines
            are the average energy and the bands are for the P90-P10 range.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCalMonthlyDailyYield()" />
          <figcaption>
            Daily energy generation for the Unika II Wind Project and a solar PV plant at Solwezi. Solid lines are the average energy and the bands are for the P90-P10 range.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCalMonthlyDailyYieldCombined()" />
          <figcaption>
              Daily energy generation for the combined plant.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Hourly Generation</span>
        <br><br>
        At the hourly timescale the difference between the diurnal generation profiles of wind and solar PV become
        even more apparent and the complementary nature of the two technologies is clear. Wind generation is generally highest at night
        when solar generation is zero. A combined plant will provide a more consistent output than either plant alone.
      </v-col>
      <v-col cols="12">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
        <v-row no-gutters>
          <v-col :key="mon" v-for="mon in Array.from(new Array(12), (x,i) => i)" cols="12" sm="6" md="4">
            <PlotlyChart :definition="chartDiurnalByMonth(mon)" />
          </v-col>
        </v-row>
        <figcaption>
          Diurnal generation profiles for the Unika II Wind Project and a solar PV plant at Solwezi by month.
        </figcaption>
      </v-sheet>
      </v-col>
      <v-col cols="12">
        The ratio of solar PV to wind capacity in a combined plant has a significant impact on the diurnal generation profile.
        Too much solar PV will result in a plant that produces significant energy during the day but much less at night.
        <a target="_blank" href="/zambia-wind-solar-storage-firm-diurnal">An analysis</a> based on the capacity of battery storage required to balance the combined plant or the
        volume of balancing energy from the grid shows that a ratio of 0.4MW of solar PV per MW of wind capacity provides the most consistent
        diurnal profile.
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMeanDiurnalCFsForRatios()" />
          <figcaption>
            Yearly average relative combined plant output for three ratios of solar PV to wind capacity.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartMonthlyDiurnalsforCombined()" />
          <figcaption>
            Average diurnal generation profiles for the combined plant by month.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Intermittency</span>
        <br><br>
        A measure of the intermittency of the energy generation is given by the coefficient of variation
        of the daily energy generation (the standard deviation as a proportion of the mean).
        Wind generation has a generally higher intermittency by this measure than solar PV generation.
        A combination of the two plants firms up the wind.
        <br><br>
        By splitting the solar plant amongst more than one location and/or by adding battery storage,
        the combined plant can be made to provide a more consistent output
        (<a href="solar-comparison" target="_blank">see here for further details</a>).
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCombinedDailyIntermittency()" />
          <figcaption>
            Coefficient of variation of daily energy generation by month for the Unika
            II Wind Project and a solar PV plant at Solwezi as well as for the combined output.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartSolarCombinedDailyIntermittency()" />
          <figcaption>
            Coefficient of variation of daily energy generation by month for a solar plant
            at Solwezi, at Sesheke and a combined plant with 50% of capacity at each location.
          </figcaption>
        </v-sheet>
      </v-col>

    </v-row>
  </PresentationPage>
</template>
