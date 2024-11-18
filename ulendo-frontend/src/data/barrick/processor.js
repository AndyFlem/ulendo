import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon'

const folder = path.dirname(fileURLToPath(import.meta.url))
// const monthDays=[31,28,31,30,31,30,31,31,30,31,30,31]

// Delete all files in the output folder
fs.readdirSync(folder + '/output').forEach(file => {
  fs.unlink(folder + '/output/' + file, (err) => {
    if (err) {
      console.error(err)
    }
  })
})

const lumwanaDemand_raw = d3.csvParse(fs.readFileSync(folder + '/input/lumwana_demand.csv', 'utf-8'), d3.autoType)
const lumwanaDemand=lumwanaDemand_raw.map(v=>{
  v.year=parseInt(v.year)
  v.demandMW=parseInt(v.demand_mw)
  v.annualEnergyGWh=parseInt(v.demand_mw)*8
  return v
})
fs.writeFileSync(folder + '/output/lumwanaDemand.csv', d3.csvFormat(lumwanaDemand))

const params = {
  capacityWindMW: 120,
  capacitySolarMW: 60,
  capacitySolar2MW: 60
}
fs.writeFileSync(folder + '/output/parameters.json', JSON.stringify(params, null, 2))

//****************************************************************
// Wind data processing
//****************************************************************

const unikaHourly = d3.csvParse(fs.readFileSync(folder + '/input/unika_180mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.mwh)/180*params.capacityWindMW
  v.capFactor = parseFloat(v.mwh)/180
  return v
})

const unikaDaily = d3.rollups(unikaHourly,v=>{
  let ret = {
    date: v[0].date,
    year: v[0].year,
    month: v[0].month,
    day: v[0].day,
    dailyCapFactor: (d3.sum(v,h=>h.energyMWh))/ (params.capacityWindMW*24),
    dailyEnergyMWh: d3.sum(v,h=>h.energyMWh)
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.date.startOf('day')).map(v=>v[1])

const unikaMonthly = d3.rollups(unikaDaily, d => {
  return {
    date: d[0].date.startOf('month'),
    year: d[0].date.year,
    month: d[0].date.month,
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    monthlyEnergyMWh: d3.sum(d, v=>v.dailyEnergyMWh),
    meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh)
  }
}, d => d.date.startOf('month')).map(v=>v[1])
//Save the monthly data to a CSV file
fs.writeFileSync(folder + '/output/unikaMonthly.csv', d3.csvFormat(unikaMonthly))

const unikaYearly = d3.rollups(unikaMonthly, d => {
  return {
    year: d[0].year,
    yearlySpecificYield: d3.sum(d,v=>v.monthlySpecificYield),
    yearlyEnergyMWh: d3.sum(d,v=>v.monthlyEnergyMWh)
  }
}, d => d.year).map(v=>v[1])
fs.writeFileSync(folder + '/output/unikaYearly.csv', d3.csvFormat(unikaYearly))

const unikaCalmonthly = d3.rollups(unikaDaily, d  => {
  let ret =  {
    date: d[0].date,
    month: d[0].month,
    p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.dailyEnergyMWh),
    p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.dailyEnergyMWh),
    meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh)
  }
  ret.meanMonthlyEnergyMWh = d3.mean(unikaMonthly.filter(v=>v.month==d[0].month), v=>v.monthlyEnergyMWh)
  ret.p90MonthlyEnergyMWh = d3.quantile(unikaMonthly.filter(v=>v.month==d[0].month), 0.9, v=>v.monthlyEnergyMWh)
  ret.p10MonthlyEnergyMWh = d3.quantile(unikaMonthly.filter(v=>v.month==d[0].month), 0.1, v=>v.monthlyEnergyMWh)

  return ret
}, d => d.month).map(v=>v[1])
fs.writeFileSync(folder + '/output/unikaCalmonthly.csv', d3.csvFormat(unikaCalmonthly))

const unikaCalmonthlyHours = (() => {
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(unikaHourly.filter(d=>d.month==m), v=>{
      return {
        month: m,
        hour: v[0].hour,
        meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
        p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
        p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor),
        meanHourlyEnergyMWh: d3.mean(v,l=>l.energyMWh),
        p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.energyMWh),
        p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.energyMWh),
      }
    },v=>v.hour).map(v=>v[1])
  })
})()
fs.writeFileSync(folder + '/output/unikaCalmonthlyHours.csv', d3.csvFormat(unikaCalmonthlyHours.flat()))


//****************************************************************
// Solar data processing
//****************************************************************
const unikaHourly = d3.csvParse(fs.readFileSync(folder + '/input/unika_180mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.mwh)/180*params.capacityWindMW
  v.capFactor = parseFloat(v.mwh)/180
  return v
})

const unikaDaily = d3.rollups(unikaHourly,v=>{
  let ret = {
    date: v[0].date,
    year: v[0].year,
    month: v[0].month,
    day: v[0].day,
    dailyCapFactor: (d3.sum(v,h=>h.energyMWh))/ (params.capacityWindMW*24),
    dailyEnergyMWh: d3.sum(v,h=>h.energyMWh)
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.date.startOf('day')).map(v=>v[1])

const unikaMonthly = d3.rollups(unikaDaily, d => {
  return {
    date: d[0].date.startOf('month'),
    year: d[0].date.year,
    month: d[0].date.month,
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    monthlyEnergyMWh: d3.sum(d, v=>v.dailyEnergyMWh),
    meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh)
  }
}, d => d.date.startOf('month')).map(v=>v[1])
//Save the monthly data to a CSV file
fs.writeFileSync(folder + '/output/unikaMonthly.csv', d3.csvFormat(unikaMonthly))

const unikaYearly = d3.rollups(unikaMonthly, d => {
  return {
    year: d[0].year,
    yearlySpecificYield: d3.sum(d,v=>v.monthlySpecificYield),
    yearlyEnergyMWh: d3.sum(d,v=>v.monthlyEnergyMWh)
  }
}, d => d.year).map(v=>v[1])
fs.writeFileSync(folder + '/output/unikaYearly.csv', d3.csvFormat(unikaYearly))

const unikaCalmonthly = d3.rollups(unikaDaily, d  => {
  let ret =  {
    date: d[0].date,
    month: d[0].month,
    p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.dailyEnergyMWh),
    p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.dailyEnergyMWh),
    meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh)
  }
  ret.meanMonthlyEnergyMWh = d3.mean(unikaMonthly.filter(v=>v.month==d[0].month), v=>v.monthlyEnergyMWh)
  ret.p90MonthlyEnergyMWh = d3.quantile(unikaMonthly.filter(v=>v.month==d[0].month), 0.9, v=>v.monthlyEnergyMWh)
  ret.p10MonthlyEnergyMWh = d3.quantile(unikaMonthly.filter(v=>v.month==d[0].month), 0.1, v=>v.monthlyEnergyMWh)

  return ret
}, d => d.month).map(v=>v[1])
fs.writeFileSync(folder + '/output/unikaCalmonthly.csv', d3.csvFormat(unikaCalmonthly))

const unikaCalmonthlyHours = (() => {
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(unikaHourly.filter(d=>d.month==m), v=>{
      return {
        month: m,
        hour: v[0].hour,
        meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
        p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
        p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor),
        meanHourlyEnergyMWh: d3.mean(v,l=>l.energyMWh),
        p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.energyMWh),
        p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.energyMWh),
      }
    },v=>v.hour).map(v=>v[1])
  })
})()
fs.writeFileSync(folder + '/output/unikaCalmonthlyHours.csv', d3.csvFormat(unikaCalmonthlyHours.flat()))
