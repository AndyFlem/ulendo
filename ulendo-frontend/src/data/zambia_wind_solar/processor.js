
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

const capacitySolarMW = 25
const capacityWindMW = 180


const solarHourly = d3.csvParse(fs.readFileSync(folder + '/input/ilute_25mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.kw)/25*capacitySolarMW/1000
  v.capFactor = parseFloat(v.kw)/(25*1000)
  return v
})

const windHourly = d3.csvParse(fs.readFileSync(folder + '/input/unika_180mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.mwh)/180*capacityWindMW
  v.capFactor = parseFloat(v.mwh)/180
  return v
})

const windDaily = d3.rollups(windHourly,v=>{
  let ret = {
    date: v[0].date,
    year: v[0].year,
    month: v[0].month,
    day: v[0].day,
    dailyCapFactor: (d3.sum(v,h=>h.energyMWh))/ (capacityWindMW*24)
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.date.startOf('day')).map(v=>v[1])


const solarDaily = d3.rollups(solarHourly,v=>{
  let ret = {
    date: v[0].date,
    year: v[0].year,
    month: v[0].month,
    day: v[0].day,
    dailyCapFactor: (d3.sum(v,h=>h.energyMWh))/ (capacitySolarMW*24)
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.date.startOf('day')).map(v=>v[1])

const period1 = {from: DateTime.fromObject({year:2019,month:2,day:9}), to: DateTime.fromObject({year:2019,month:2,day:20})}
const period2 = {from: DateTime.fromObject({year:2019,month:6,day:9}), to: DateTime.fromObject({year:2019,month:6,day:20})}

periodCapFactor(period1.from, period1.to, 'Feb2019')
periodCapFactor(period2.from, period2.to, 'June2019')

function periodCapFactor(from, to, name){
  const solarHours = solarHourly.filter(v=> v.date > from && v.date < to)
  const windHours = windHourly.filter(v=> v.date > from && v.date < to)
  const windDays = windDaily.filter(v=> v.date > from.minus({day:1}) && v.date < to )
  const solarDays = solarDaily.filter(v=> v.date > from.minus({day:1}) && v.date < to )

  const days = windDays.map((v,i)=>{
    return {
      date: v.date.plus({hours:12}).toISO(),
      year: v.year,
      month: v.month,
      day: v.day,
      wind_dailyCapFactor: v.dailyCapFactor,
      solar_dailyCapFactor: solarDays[i].dailyCapFactor,
    }
  })
  const hours = windHours.map((v,i)=>{
    return {
      date: v.date.toISO(),
      year: v.year,
      month: v.month,
      day: v.day,
      hour: v.hour,
      wind_capFactor: v.capFactor,
      solar_capFactor: solarHours[i].capFactor,
    }
  })
  fs.writeFileSync(folder + `/output/dailyCapFactor${name}.csv`, d3.csvFormat(days))
  fs.writeFileSync(folder + `/output/hourlyCapFactor${name}.csv`, d3.csvFormat(hours))
}
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
  ret.capFactor = ret.energyMWh/(capacitySolarMW+capacityWindMW)
  return ret
  })

const combinedDaily = d3.rollups(combinedHourly,v=>{
    let ret = {
      date: v[0].date,
      year: v[0].year,
      month: v[0].month,
      day: v[0].day,
      wind_dailyCapFactor: (d3.sum(v,h=>h.wind_energyMWh))/ (capacityWindMW*24),
      wind_dailyEnergyMWh: d3.sum(v,h=>h.wind_energyMWh),
      solar_dailyCapFactor: (d3.sum(v,h=>h.solar_energyMWh))/ (capacitySolarMW*24),
      solar_dailyEnergyMWh: d3.sum(v,h=>h.solar_energyMWh)
    }
    ret.dailyEnergyMWh = ret.solar_dailyEnergyMWh + ret.wind_dailyEnergyMWh

    ret.dailyCapFactor = (ret.solar_dailyEnergyMWh + ret.wind_dailyEnergyMWh) / ((capacityWindMW + capacitySolarMW) * 24)

    return ret
  }, v=>v.date.startOf('day')).map(v=>v[1])

const combinedMonthly = d3.rollups(combinedDaily, d => {
    return {
      date: d[0].date.startOf('month'),
      year: d[0].date.year,
      month: d[0].date.month,
      meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
      meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh),
      p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.dailyEnergyMWh),
      p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.dailyEnergyMWh),
      monthlyEnergyMWh: d3.sum(d, v => v.dailyEnergyMWh),
      wind_meanDailyCapFactor: d3.mean(d, v=>v.wind_dailyCapFactor),
      wind_monthlyEnergyMWh: d3.sum(d, v => v.wind_dailyEnergyMWh),
      wind_meanDailyEnergyMWh: d3.mean(d, v=>v.wind_dailyEnergyMWh),
      wind_p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.wind_dailyEnergyMWh),
      wind_p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.wind_dailyEnergyMWh),
      solar_meanDailyCapFactor: d3.mean(d, v=>v.solar_dailyCapFactor),
      solar_monthlyEnergyMWh: d3.sum(d, v => v.solar_dailyEnergyMWh),
      solar_meanDailyEnergyMWh: d3.mean(d, v=>v.solar_dailyEnergyMWh),
      solar_p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.solar_dailyEnergyMWh),
      solar_p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.solar_dailyEnergyMWh)
    }
  }, d => d.date.startOf('month')).map(v=>v[1])
fs.writeFileSync(folder + '/output/combinedMonthly.csv', d3.csvFormat(combinedMonthly))

const combinedYearly = d3.rollups(combinedMonthly, d => {
  return {
    date: d[0].date.startOf('month'),
    year: d[0].date.year,
    yearlyEnergyMWh: d3.sum(d, v => v.monthlyEnergyMWh),
    wind_yearlyEnergyMWh: d3.sum(d, v => v.wind_monthlyEnergyMWh),
    solar_yearlyEnergyMWh: d3.sum(d, v => v.solar_monthlyEnergyMWh)
  }
  }, d => d.date.startOf('year')).map(v=>v[1])
fs.writeFileSync(folder + '/output/combinedYearly.csv', d3.csvFormat(combinedYearly))

const combinedCalmonthly = d3.rollups(combinedDaily, d  => {
    let ret =  {
      date: d[0].date,
      month: d[0].month,

      combined_meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
      combined_meanDailyEnergyMWh: d3.mean(d, v=>v.dailyEnergyMWh),
      combined_p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.dailyEnergyMWh),
      combined_p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.dailyEnergyMWh),
      wind_meanDailyCapFactor: d3.mean(d, v=>v.wind_dailyCapFactor),
      wind_meanDailyEnergyMWh: d3.mean(d, v=>v.wind_dailyEnergyMWh),
      wind_p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.wind_dailyEnergyMWh),
      wind_p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.wind_dailyEnergyMWh),
      solar_meanDailyCapFactor: d3.mean(d, v=>v.solar_dailyCapFactor),
      solar_meanDailyEnergyMWh: d3.mean(d, v=>v.solar_dailyEnergyMWh),
      solar_p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.solar_dailyEnergyMWh),
      solar_p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.solar_dailyEnergyMWh)

    }
    ret.meanMonthlyEnergyMWh = d3.mean(combinedMonthly.filter(v=>v.month==d[0].month),v=>v.monthlyEnergyMWh)
    ret.p90MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.9,v=>v.monthlyEnergyMWh)
    ret.p10MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.1,v=>v.monthlyEnergyMWh)

    ret.wind_meanMonthlyEnergyMWh = d3.mean(combinedMonthly.filter(v=>v.month==d[0].month),v=>v.wind_monthlyEnergyMWh)
    ret.wind_p90MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.9,v=>v.wind_monthlyEnergyMWh)
    ret.wind_p10MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.1,v=>v.wind_monthlyEnergyMWh)

    ret.solar_meanMonthlyEnergyMWh = d3.mean(combinedMonthly.filter(v=>v.month==d[0].month),v=>v.solar_monthlyEnergyMWh)
    ret.solar_p90MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.9,v=>v.solar_monthlyEnergyMWh)
    ret.solar_p10MonthlyEnergyMWh = d3.quantile(combinedMonthly.filter(v=>v.month==d[0].month),0.1,v=>v.solar_monthlyEnergyMWh)

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

          solar_meanHourlyCapFactor: d3.mean(v,l=>l.solar_capFactor),
          solar_p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.solar_capFactor),
          solar_p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.solar_capFactor),
          solar_meanHourlyEnergyMWh: d3.mean(v,l=>l.solar_energyMWh),
          solar_p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.solar_energyMWh),
          solar_p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.solar_energyMWh),
          wind_meanHourlyCapFactor: d3.mean(v,l=>l.wind_capFactor),
          wind_p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.wind_capFactor),
          wind_p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.wind_capFactor),
          wind_meanHourlyEnergyMWh: d3.mean(v,l=>l.wind_energyMWh),
          wind_p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.wind_energyMWh),
          wind_p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.wind_energyMWh),
        }
      },v=>v.hour).map(v=>v[1])
    })
  })()
fs.writeFileSync(folder + '/output/combinedCalmonthlyHours.csv', d3.csvFormat(combinedCalmonthlyHours.flat()))

