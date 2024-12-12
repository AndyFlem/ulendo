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


const site1Hourly = d3.csvParse(fs.readFileSync(folder + '/../ilute/output/iluteHourly.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})

const site2Hourly = d3.csvParse(fs.readFileSync(folder + '/../kalumbila/output/kalumbilaHourly.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date = DateTime.fromJSDate(v.datetime)
  return v
})

const combinations = [0,0.5,1]

const combinedHourly = combinations.map(c => {
  return {
    site1Scale: c,
    site2Scale: 1-c,
    hourly: site1Hourly.map((v,i) => {
      return {
        date: v.date,
        year: v.year,
        month: v.month,
        day: v.day,
        hour: v.hour,
        site1CapFactor: v.capFactor,
        site2CapFactor: site2Hourly[i].capFactor,
        combinedCapFactor: (v.capFactor * c) + (site2Hourly[i].capFactor * (1-c)),
      }
    }),
  }
})

const daily = combinedHourly.map(c=>{
  return d3.rollups(c.hourly,v=>{
    let ret = {
      site1Scale: c.site1Scale,
      date: v[0].date,
      year: v[0].year,
      month: v[0].month,
      day: v[0].day,
      capFactor: d3.mean(v,h=>h.combinedCapFactor)
    }
    ret.specificYield = ret.capFactor * 24

    return ret
  }, v=>v.date.startOf('day')).map(v=>v[1])
})

const monthly = daily.map(c=>{
  return d3.rollups(c, d => {
    let ret =  {
      site1Scale: d[0].site1Scale,
      date: d[0].date.startOf('month'),
      datetime: d[0].date.toISO(),
      year: d[0].date.year,
      month: d[0].date.month,
      meanDailyCapFactor: d3.mean(d, v=>v.capFactor),
      stdevDailyCapFactor: d3.deviation(d, v=>v.capFactor),
      specificYield: d3.sum(d, v => v.capFactor * 24),  //MWh/MW
    }
    ret.coefVarDailyCapFactor = ret.stdevDailyCapFactor/ret.meanDailyCapFactor
    return ret
  }, d => d.date.startOf('month')).map(v=>v[1])
}).flat()



const calmonthly = daily.map(c=>{
  return d3.rollups(c, d  => {
    let ret =  {
      site1Scale: d[0].site1Scale,
      date: d[0].date,
      month: d[0].month,

      p90DailyCapFactor: d3.quantile(d, 0.9, v=>v.capFactor),
      p10DailyCapFactor: d3.quantile(d, 0.1, v=>v.capFactor),
      meanDailyCapFactor: d3.mean(d, v=>v.capFactor),
      medianDailyCapFactor: d3.median(d, v=>v.capFactor),
      stdevDailyCapFactor: d3.deviation(d, v=>v.capFactor),

      p90DailySpecificYield: d3.quantile(d, 0.9, v=>v.specificYield),
      p10DailySpecificYield: d3.quantile(d, 0.1, v=>v.specificYield),
      meanDailySpecificYield: d3.mean(d, v=>v.specificYield),
      medianDailySpecificYield: d3.quantile(d, 0.5, v=>v.specificYield),
      stdevDailySpecificYield: d3.deviation(d, v=>v.specificYield),
    }

    ret.coefVarDailyCapFactor = ret.stdevDailyCapFactor/ret.meanDailyCapFactor

    ret.p90MonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.9,v=>v.specificYield)
    ret.p10MonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.1,v=>v.specificYield)
    ret.meanMonthlySpecificYield = d3.mean(monthly.filter(v=>v.month==d[0].month),v=>v.specificYield)
    ret.medianMonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.5,v=>v.specificYield)

    return ret
  }, d => d.month).map(v=>v[1])
}).flat()


fs.writeFileSync(folder + `/output/SolarMixingMonthly.csv`, d3.csvFormat(monthly))
fs.writeFileSync(folder + `/output/SolarMixingCalmonthly.csv`, d3.csvFormat(calmonthly))
