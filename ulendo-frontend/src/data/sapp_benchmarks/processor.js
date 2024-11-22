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

const damHourly = d3.csvParse(fs.readFileSync(folder + '/../sapp/output/dam/dam_hourly.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})
const damMonthly = d3.csvParse(fs.readFileSync(folder + '/../sapp/output/dam/dam_monthly.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})


// ###########################################################
// Solar Benchmark
// ###########################################################

const solarCalmonthlyHours = d3.csvParse(fs.readFileSync(folder + '/../zambia_wind_solar/output/solarCalmonthlyHours.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})
const solarCalmonthlyTotals = d3.rollups(solarCalmonthlyHours, v => {
  return {
    month: v[0].month,
    totalCapFactor: d3.sum(v, d => d.meanHourlyCapFactor)
  }
},v=>v.month).map(v=>v[1])

const solarHourlyWeightedPrice = damHourly.map(v=> {
  const factor = solarCalmonthlyHours.find(d=>
    d.month == v.month &&
    d.hour==v.hour).meanHourlyCapFactor / solarCalmonthlyTotals.find(d=>d.month==v.month).totalCapFactor

  let ret = {
    date:v.date,
    luxdate: DateTime.fromJSDate(v.date),
    weightedPrice: factor * v.price,
    DAMPrice: v.price
  }

  return ret
})

let solarDailyPrice = d3.rollups(solarHourlyWeightedPrice, v => {
  const ret = {
    date: v[0].date,
    luxdate: v[0].luxdate,
    DAMPriceMean: d3.mean(v, d => d.DAMPrice),
    price: d3.sum(v, d => d.weightedPrice)
  }
  ret.solarPriceRelativeDAM = (ret.price-ret.DAMPriceMean) / ret.DAMPriceMean
  return ret
}, v => v.date).map(v=>v[1])

let solarMonthlyPrice = d3.rollups(solarDailyPrice, v => {
  const ret = {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price),
    DAMPriceMean: damMonthly.find(d=>d.month==v[0].luxdate.month && d.year==v[0].luxdate.year).priceMean
  }
  ret.solarPriceRelativeDAM = (ret.priceMean-ret.DAMPriceMean) / ret.DAMPriceMean
  return ret
}, v => v.luxdate.startOf('month')).map(v=>v[1])

solarMonthlyPrice = solarMonthlyPrice.map((v,i) => {
  if (i>0) {
    v.priceChange = v.priceMean - solarMonthlyPrice[i-1].priceMean
    v.priceRelativeChange = v.priceChange / solarMonthlyPrice[i-1].priceMean
  }
  return v
})

const solarYearlyPrice = d3.rollups(solarDailyPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price)
  }
}, v => v.luxdate.startOf('year')).map(v=>v[1])

solarDailyPrice.map(d=>{delete d.luxdate})
solarMonthlyPrice.map(d=>{delete d.luxdate})
solarYearlyPrice.map(d=>{delete d.luxdate})

fs.writeFileSync(folder + '/output/dailySolarBenchmarkPrice.csv', d3.csvFormat(solarDailyPrice))
fs.writeFileSync(folder + '/output/monthlySolarBenchmarkPrice.csv', d3.csvFormat(solarMonthlyPrice))
fs.writeFileSync(folder + '/output/yearlySolarBenchmarkPrice.csv', d3.csvFormat(solarYearlyPrice))



// ###########################################################
// Wind Benchmark
// ###########################################################

const windCalmonthlyHours = d3.csvParse(fs.readFileSync(folder + '/../zambia_wind_solar/output/windCalmonthlyHours.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})
const windCalmonthlyTotals = d3.rollups(windCalmonthlyHours, v => {
  return {
    month: v[0].month,
    totalCapFactor: d3.sum(v, d => d.meanHourlyCapFactor)
  }
},v=>v.month).map(v=>v[1])

const windHourlyWeightedPrice = damHourly.map(v=> {
  const factor = windCalmonthlyHours.find(d=>
    d.month == v.month &&
    d.hour==v.hour).meanHourlyCapFactor / windCalmonthlyTotals.find(d=>d.month==v.month).totalCapFactor

  let ret = {
    date:v.date,
    luxdate: DateTime.fromJSDate(v.date),
    weightedPrice: factor * v.price,
    DAMPrice: v.price
  }

  return ret
})

let windDailyPrice = d3.rollups(windHourlyWeightedPrice, v => {
  const ret = {
    date: v[0].date,
    luxdate: v[0].luxdate,
    DAMPriceMean: d3.mean(v, d => d.DAMPrice),
    price: d3.sum(v, d => d.weightedPrice)
  }
  ret.windPriceRelativeDAM = (ret.price-ret.DAMPriceMean) / ret.DAMPriceMean
  return ret
}, v => v.date).map(v=>v[1])

let windMonthlyPrice = d3.rollups(windDailyPrice, v => {
  const ret = {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price),
    DAMPriceMean: damMonthly.find(d=>d.month==v[0].luxdate.month && d.year==v[0].luxdate.year).priceMean
  }
  ret.windPriceRelativeDAM = (ret.priceMean-ret.DAMPriceMean) / ret.DAMPriceMean
  return ret
}, v => v.luxdate.startOf('month')).map(v=>v[1])

windMonthlyPrice = windMonthlyPrice.map((v,i) => {
  if (i>0) {
    v.priceChange = v.priceMean - windMonthlyPrice[i-1].priceMean
    v.priceRelativeChange = v.priceChange / windMonthlyPrice[i-1].priceMean
  }
  return v
})

const windYearlyPrice = d3.rollups(windDailyPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price)
  }
}, v => v.luxdate.startOf('year')).map(v=>v[1])

windDailyPrice.map(d=>{delete d.luxdate})
windMonthlyPrice.map(d=>{delete d.luxdate})
windYearlyPrice.map(d=>{delete d.luxdate})

fs.writeFileSync(folder + '/output/dailyWindBenchmarkPrice.csv', d3.csvFormat(windDailyPrice))
fs.writeFileSync(folder + '/output/monthlyWindBenchmarkPrice.csv', d3.csvFormat(windMonthlyPrice))
fs.writeFileSync(folder + '/output/yearlyWindBenchmarkPrice.csv', d3.csvFormat(windYearlyPrice))

