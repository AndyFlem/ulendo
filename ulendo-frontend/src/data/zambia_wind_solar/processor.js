/* eslint-disable no-loss-of-precision */
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

const monthDays=[31,28,31,30,31,30,31,31,30,31,30,31]

//****************************************************************
// Wind data processing
//****************************************************************

const windDiurnal = d3.rollups(windHourly,v=>{
  let ret = {
    hour: v[0].hour,
    capFactor: (d3.mean(v,h=>h.capFactor))
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.hour).map(v=>v[1])
fs.writeFileSync(folder + '/output/windDiurnal.csv', d3.csvFormat(windDiurnal))

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

const windMonthly = d3.rollups(windDaily, d => {
  return {
    date: d[0].date.startOf('month'),
    year: d[0].date.year,
    month: d[0].date.month,
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    monthlySpecificYield: d3.sum(d, v => v.dailyCapFactor * 24)  //MWh/MW
  }
}, d => d.date.startOf('month')).map(v=>v[1])
//Save the monthly data to a CSV file
fs.writeFileSync(folder + '/output/windMonthly.csv', d3.csvFormat(windMonthly))

const windYearly_tmp = d3.rollups(windMonthly, d => {
  return {
    year: d[0].year,
    yearlySpecificYield: d3.sum(d,v=>v.monthlySpecificYield)
  }
}, d => d.year).map(v=>v[1])
const windMedianAnualSpecificYield=d3.median(windYearly_tmp,v=>v.yearlySpecificYield)

const windYearly = windYearly_tmp.map(v=>{
  v.normalisedYearlySpecificYield = v.yearlySpecificYield/windMedianAnualSpecificYield
  return v
})
fs.writeFileSync(folder + '/output/windYearly.csv', d3.csvFormat(windYearly))

const windCalmonthly = d3.rollups(windDaily, d  => {
  let ret =  {
    date: d[0].date,
    month: d[0].month,
    p90DailyCapFactor: d3.quantile(d, 0.9, v=>v.dailyCapFactor),
    p10DailyCapFactor: d3.quantile(d, 0.1, v=>v.dailyCapFactor),
    maxDailyCapFactor: d3.max(d, v=>v.dailyCapFactor),
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    maxDailySpecificYield: d3.max(d, v=>v.dailySpecificYield),
    p90DailySpecificYield: d3.quantile(d, 0.9, v=>v.dailySpecificYield),
    p10DailySpecificYield: d3.quantile(d, 0.1, v=>v.dailySpecificYield),
    meanDailySpecificYield: d3.mean(d, v=>v.dailySpecificYield),
    medianDailySpecificYield: d3.quantile(d, 0.5, v=>v.dailySpecificYield),
  }
  ret.maxMonthlySpecificYield = ret.maxDailySpecificYield * monthDays[ret.month-1]//MWh/MW taking account of seasonality

  ret.meanMonthlySpecificYield = d3.mean(windMonthly.filter(v=>v.month==d[0].month),v=>v.monthlySpecificYield)
  ret.medianMonthlySpecificYield = d3.quantile(windMonthly.filter(v=>v.month==d[0].month),0.5,v=>v.monthlySpecificYield)
  ret.p90MonthlySpecificYield = d3.quantile(windMonthly.filter(v=>v.month==d[0].month),0.9,v=>v.monthlySpecificYield)
  ret.p10MonthlySpecificYield = d3.quantile(windMonthly.filter(v=>v.month==d[0].month),0.1,v=>v.monthlySpecificYield)
  return ret
}, d => d.month).map(v=>v[1])
fs.writeFileSync(folder + '/output/windCalmonthly.csv', d3.csvFormat(windCalmonthly))

const windCalmonthlyHours = (() => {
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(windHourly.filter(d=>d.month==m), v=>{
      return {
        month: m,
        hour: v[0].hour,
        meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
        p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
        p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor)
      }
    },v=>v.hour).map(v=>v[1])
  })
})()
fs.writeFileSync(folder + '/output/windCalmonthlyHours.csv', d3.csvFormat(windCalmonthlyHours.flat()))

const windAnnualExceedance=windYearly.toSorted((a,b) => a.yearlySpecificYield-b.yearlySpecificYield).map((v,i) => {
  v.exceedance = 1-(i/windYearly.length)
  v.normalisedYearlySpecificYield = v.yearlySpecificYield/windMedianAnualSpecificYield
  return v
})
fs.writeFileSync(folder + '/output/windAnnualExceedance.csv', d3.csvFormat(windAnnualExceedance))

const windDurationVariability= (()=>{
  let durations = [5, 10, 15, 18, 20, 25]

  let stDev = d3.deviation(windYearly,v=>v.yearlySpecificYield)
  let mean = d3.mean(windYearly,v=>v.yearlySpecificYield)

  return durations.map(d=>{
    return {
      duration_years: d,
      stDev: stDev/Math.sqrt(d),
      p50: mean,
      p75: normalinv(0.25, mean, stDev/Math.sqrt(d)),
      p90: normalinv(0.10, mean, stDev/Math.sqrt(d)),
      p99: normalinv(0.01, mean, stDev/Math.sqrt(d))
    }
  })
})()
fs.writeFileSync(folder + '/output/windDurationVariability.csv', d3.csvFormat(windDurationVariability))

const windStatistics = [{
  years: windYearly.length,
  months: windMonthly.length,
  medianAnualSpecificYield: windMedianAnualSpecificYield
}]
fs.writeFileSync(folder + '/output/windStatistics.csv', d3.csvFormat(windStatistics))

//****************************************************************
// Solar data processing
//****************************************************************

const solarDiurnal = d3.rollups(solarHourly,v=>{
  let ret = {
    hour: v[0].hour,
    capFactor: (d3.mean(v,h=>h.capFactor))
  }
  ret.dailySpecificYield = ret.dailyCapFactor * 24

  return ret
}, v=>v.hour).map(v=>v[1])
fs.writeFileSync(folder + '/output/solarDiurnal.csv', d3.csvFormat(solarDiurnal))

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

const solarMonthly = d3.rollups(solarDaily, d => {
  return {
    date: d[0].date.startOf('month'),
    year: d[0].date.year,
    month: d[0].date.month,
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    monthlySpecificYield: d3.sum(d, v => v.dailyCapFactor * 24)  //MWh/MW
  }
}, d => d.date.startOf('month')).map(v=>v[1])
fs.writeFileSync(folder + '/output/solarMonthly.csv', d3.csvFormat(solarMonthly))

const solarYearly_tmp = d3.rollups(solarMonthly, d => {
  return {
    year: d[0].year,
    yearlySpecificYield: d3.sum(d,v=>v.monthlySpecificYield)
  }
}, d => d.year).map(v=>v[1])
const solarMedianAnualSpecificYield=d3.median(solarYearly_tmp,v=>v.yearlySpecificYield)

const solarYearly = solarYearly_tmp.map(v=>{
  v.normalisedYearlySpecificYield = v.yearlySpecificYield/solarMedianAnualSpecificYield
  return v
})
fs.writeFileSync(folder + '/output/solarYearly.csv', d3.csvFormat(solarYearly))

const solarCalmonthly = d3.rollups(solarDaily, d  => {
  let ret =  {
    date: d[0].date,
    month: d[0].month,
    p90DailyCapFactor: d3.quantile(d, 0.9, v=>v.dailyCapFactor),
    p10DailyCapFactor: d3.quantile(d, 0.1, v=>v.dailyCapFactor),
    maxDailyCapFactor: d3.max(d, v=>v.dailyCapFactor),
    meanDailyCapFactor: d3.mean(d, v=>v.dailyCapFactor),
    maxDailySpecificYield: d3.max(d, v=>v.dailySpecificYield),
    p90DailySpecificYield: d3.quantile(d, 0.9, v=>v.dailySpecificYield),
    p10DailySpecificYield: d3.quantile(d, 0.1, v=>v.dailySpecificYield),
    meanDailySpecificYield: d3.mean(d, v=>v.dailySpecificYield),
    medianDailySpecificYield: d3.quantile(d, 0.5, v=>v.dailySpecificYield),
  }
  ret.maxMonthlySpecificYield = ret.maxDailySpecificYield * monthDays[ret.month-1]//MWh/MW taking account of seasonality

  ret.meanMonthlySpecificYield = d3.mean(solarMonthly.filter(v=>v.month==d[0].month),v=>v.monthlySpecificYield)
  ret.medianMonthlySpecificYield = d3.quantile(solarMonthly.filter(v=>v.month==d[0].month),0.5,v=>v.monthlySpecificYield)
  ret.p90MonthlySpecificYield = d3.quantile(solarMonthly.filter(v=>v.month==d[0].month),0.9,v=>v.monthlySpecificYield)
  ret.p10MonthlySpecificYield = d3.quantile(solarMonthly.filter(v=>v.month==d[0].month),0.1,v=>v.monthlySpecificYield)

  return ret
}, d => d.month).map(v=>v[1])
fs.writeFileSync(folder + '/output/solarCalmonthly.csv', d3.csvFormat(solarCalmonthly))

const solarCalmonthlyHours=(()=>{
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(solarHourly.filter(d=>d.month==m), v=>{
      return {
        month: m,
        hour: v[0].hour,
        meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
        p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
        p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor)
      }
    },v=>v.hour).map(v=>v[1])
  })
})()
fs.writeFileSync(folder + '/output/solarCalmonthlyHours.csv', d3.csvFormat(solarCalmonthlyHours.flat()))

const solarAnnualExceedance=solarYearly.toSorted((a,b) => a.yearlySpecificYield-b.yearlySpecificYield).map((v,i) => {
  v.exceedance = 1-(i/solarYearly.length)
  v.normalisedYearlySpecificYield = v.yearlySpecificYield/solarMedianAnualSpecificYield
  return v
})
fs.writeFileSync(folder + '/output/solarAnnualExceedance.csv', d3.csvFormat(solarAnnualExceedance))

const solarDurationVariability = (()=>{
  let durations = [5, 10, 15, 18, 20, 25]

  let stDev = d3.deviation(solarYearly,v=>v.yearlySpecificYield)
  let mean = d3.mean(solarYearly,v=>v.yearlySpecificYield)

  return durations.map(d=>{
    return {
      duration_years: d,
      stDev: stDev/Math.sqrt(d),
      p50: mean,
      p75: normalinv(0.25, mean, stDev/Math.sqrt(d)),
      p90: normalinv(0.10, mean, stDev/Math.sqrt(d)),
      p99: normalinv(0.01, mean, stDev/Math.sqrt(d))
    }
  })

})()
fs.writeFileSync(folder + '/output/solarDurationVariability.csv', d3.csvFormat(solarDurationVariability))

const solarStatistics = [{
  years: solarYearly.length,
  months: solarMonthly.length,
  medianAnualSpecificYield: solarMedianAnualSpecificYield
}]
fs.writeFileSync(folder + '/output/solarStatistics.csv', d3.csvFormat(solarStatistics))

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


//****************************************************************
// Wind + solar combined data processing
//****************************************************************
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



function normalinv(p, mean, std) {
  return -1.41421356237309505 * std * erfcinv(2 * p) + mean;

  function erfcinv(p) {
    var j = 0;
    var x, err, t, pp;
    if (p >= 2)
      return -100;
    if (p <= 0)
      return 100;
    pp = (p < 1) ? p : 2 - p;
    t = Math.sqrt(-2 * Math.log(pp / 2));
    x = -0.70711 * ((2.30753 + t * 0.27061) /
      (1 + t * (0.99229 + t * 0.04481)) - t);
    for (; j < 2; j++) {
      err = erfc(x) - pp;
      x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
    }
    return (p < 1) ? x : -x;
  }

  function erfc(x) {
    return 1 - erf(x);
  }

  function erf(x) {
    var cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
      -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
      4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
      1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
      6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
      -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
      -6.886027e-12, 8.94487e-13, 3.13092e-13,
      -1.12708e-13, 3.81e-16, 7.106e-15,
      -1.523e-15, -9.4e-17, 1.21e-16,
      -2.8e-17
    ];
    var j = cof.length - 1;
    var isneg = false;
    var d = 0;
    var dd = 0;
    var t, ty, tmp, res;

    if (x < 0) {
      x = -x;
      isneg = true;
    }

    t = 2 / (2 + x);
    ty = 4 * t - 2;

    for (; j > 0; j--) {
      tmp = d;
      d = ty * d - dd + cof[j];
      dd = tmp;
    }

    res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
    return isneg ? res - 1 : 1 - res;
  }
}

