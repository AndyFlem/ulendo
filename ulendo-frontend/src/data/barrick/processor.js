import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon'

const folder = path.dirname(fileURLToPath(import.meta.url))

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
  capacitySolarMW: 50
}
//fs.writeFileSync(folder + '/output/parameters.json', JSON.stringify(params, null, 2))


const windHourly = d3.csvParse(fs.readFileSync(folder + '/../unika2/output/unikaHourly.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})

const solarHourly = d3.csvParse(fs.readFileSync(folder + '/../kalumbila/output/kalumbilaHourly.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})

const windDaily = d3.csvParse(fs.readFileSync(folder + '/../unika2/output/unikaDaily.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})
const solarDaily = d3.csvParse(fs.readFileSync(folder + '/../kalumbila/output/kalumbilaDaily.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})

const combinedDaily = windDaily.map((h,i)=>{
  let ret = {
    date: h.date,
    year: h.year,
    month: h.month,
    day: h.day,
    wind_energyMWh: h.energyMWh,
    wind_capFactor: h.capFactor,
    solar_energyMWh: solarDaily[i+solarDaily.length-windDaily.length].energyMWh,
    solar_capFactor: solarDaily[i+solarDaily.length-windDaily.length].capFactor

  }
  ret.energyMWh = ret.wind_energyMWh + ret.solar_energyMWh
  ret.capFactor = ret.energyMWh/((params.capacitySolarMW+params.capacityWindMW)*24)
  return ret
})

const combinedHourly = windHourly.map((h,i)=>{
  let ret = {
    date: h.date,
    year: h.year,
    month: h.month,
    day: h.day,
    hour: h.hour,
    wind_energyMWh: h.energyMWh,
    wind_capFactor: h.capFactor,
    solar_energyMWh: solarHourly[i+solarHourly.length-windHourly.length].energyMWh,
    solar_capFactor: solarHourly[i+solarHourly.length-windHourly.length].capFactor

  }
  ret.energyMWh = ret.wind_energyMWh + ret.solar_energyMWh
  ret.capFactor = ret.energyMWh/(params.capacitySolarMW+params.capacityWindMW)
  return ret
  })


const combinedCalmonthly = d3.rollups(combinedDaily, d  => {
  let ret =  {
    date: d[0].date,
    month: d[0].month,

    meanDailyWeatherImpact: d3.mean(d, v=>v.weatherImpact),

    p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.energyMWh),
    p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.energyMWh),
    meanDailyEnergyMWh: d3.mean(d, v=>v.energyMWh),
    medianDailyEnergyMWh: d3.median(d, v=>v.energyMWh),
    coefVarDailyEnergy: d3.deviation(d, v=>v.energyMWh)/d3.mean(d, v=>v.energyMWh),
  }

  return ret
}, d => d.month).map(v=>v[1])
fs.writeFileSync(folder + '/output/combinedCalmonthly.csv', d3.csvFormat(combinedCalmonthly))

const combinedCalmonthlyHours = (() => {
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(combinedHourly.filter(d=>d.month==m), v=>{
      return {
        month: m,
        hour: v[0].hour,
        meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
        p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
        p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor),
        meanHourlyEnergyMWh: d3.mean(v,l=>l.energyMWh),
        p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.energyMWh),
        p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.energyMWh),
        coefVarHourlyEnergy: d3.deviation(v,l=>l.energyMWh)/d3.mean(v,l=>l.energyMWh),

        solar_meanHourlyCapFactor: d3.mean(v,l=>l.solar_capFactor),
        solar_p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.solar_capFactor),
        solar_p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.solar_capFactor),
        solar_meanHourlyEnergyMWh: d3.mean(v,l=>l.solar_energyMWh),
        solar_p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.solar_energyMWh),
        solar_p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.solar_energyMWh),
        solar_coefVarHourlyEnergy: d3.deviation(v,l=>l.solar_energyMWh)/d3.mean(v,l=>l.solar_energyMWh),

        wind_meanHourlyCapFactor: d3.mean(v,l=>l.wind_capFactor),
        wind_p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.wind_capFactor),
        wind_p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.wind_capFactor),
        wind_meanHourlyEnergyMWh: d3.mean(v,l=>l.wind_energyMWh),
        wind_p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.wind_energyMWh),
        wind_p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.wind_energyMWh),
        wind_coefVarHourlyEnergy: d3.deviation(v,l=>l.wind_energyMWh)/d3.mean(v,l=>l.wind_energyMWh),
      }
    },v=>v.hour).map(v=>v[1])
  })
})()
fs.writeFileSync(folder + '/output/combinedCalmonthlyHours.csv', d3.csvFormat(combinedCalmonthlyHours.flat()))

