<script setup>
  import {  inject, computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import {  max } from 'd3-array'
  //import { groups, min, max, mean, sum } from 'd3-array'
  import { format } from 'd3-format'

  import PlotlyChart from '@/components/PlotlyChart.vue'

  const { smAndUp } = useDisplay()

  import PresentationPage from '@/components/PresentationPage.vue'

  const colors = inject('colors')
  const font = inject('font')
  const makeTrans = inject('makeTrans')
  //const months = inject('months')

  import lumwanaDemand from '@/data/barrick/output/lumwanaDemand.csv'
  //import parameters from '@/data/barrick/output/parameters.json'
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
        The challenge is to match the supply of renewable energy with the industrial demand and whilst, in Zambia,
        <router-link  :to="{name: 'WindSolarStorageFirm'}">certain combinations of renewable energy
        sources can be complementary</router-link>, medium and long-term smoothing and balancing services - either from
        the utility or the regional power market - are required to ensure a consistent supply.
        <br><br>
        This analysis considers the partial supply of the mine demand with variable renewable energy from a combination of
        the {{ unikaStatistics.capacity }}MW Mphepo Power - Unika II Wind Project and {{ kalumbilaStatistics.capacity }}MW Solwezi Solar PV projects in Zambia.
        <br><br>
        The energy yield variability and intermittency of the two projects are shown in the following charts.
      </v-col>
      <v-col cols="12">
        <span class="text-h6 text-sm-h5 text-md-h4">Annual Generation</span>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartUnikaAnnualYieldExceedance()" />
          <figcaption>
            Annual energy exceedance probability curve for the Unika II Wind Project showing the probability of exceeding a given annual energy yield.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartKalumbilaAnnualYieldExceedance()" />
          <figcaption>
            Annual energy exceedance probability curve for the Solwezi Solar PV Project showing the probability of exceeding a given annual energy yield.
          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="8">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCombinedAnnual()" />
          <figcaption>
            Simulated annual energy generation from the Unika II Wind Project and Solwezi Solar PV Project.
            Forecasted Lumwana mine demand for selected years is overlaid.
          </figcaption>
        </v-sheet>
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

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCalMonthlyDailyYield()" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
      <v-col :class="smAndUp?'':'px-0'" cols="12" md="6">
        <v-sheet :class="smAndUp?'border mr-2 pr-2':'border ma-0 pa-0'">
          <PlotlyChart :definition="chartCalMonthlyDailyYieldCombined()" />
          <figcaption>

          </figcaption>
        </v-sheet>
      </v-col>
    </v-row>
  </PresentationPage>
</template>
