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
const solarCalmonthlyHours = d3.csvParse(fs.readFileSync(folder + '/../zambia_wind_solar/output/solarCalmonthlyHours.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})

const solarCalmonthlyTotals = d3.rollups(solarCalmonthlyHours, v => {
  return {
    month: v[0].month,
    totalCapFactor: d3.sum(v, d => d.meanHourlyCapFactor)
  }
},v=>v.month).map(v=>v[1])


const hourlyWeightedPrice = damHourly.map(v=> {
  const factor = solarCalmonthlyHours.find(d=>
    d.month == v.month &&
    d.hour==v.hour).meanHourlyCapFactor / solarCalmonthlyTotals.find(d=>d.month==v.month).totalCapFactor

  let ret = {
    date:v.date,
    luxdate: DateTime.fromJSDate(v.date),
    weightedPrice: factor * v.price
  }

  return ret
})

const dailyPrice = d3.rollups(hourlyWeightedPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    price: d3.sum(v, d => d.weightedPrice)
  }
}, v => v.date).map(v=>v[1])

let monthlyPrice = d3.rollups(dailyPrice, v => {
  const ret = {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price),
    DAMPriceMean: damMonthly.find(d=>d.month==v[0].luxdate.month && d.year==v[0].luxdate.year).priceMean
  }
  ret.solarPriceRelativeDAM = ret.priceMean / ret.DAMPriceMean
  return ret
}, v => v.luxdate.startOf('month')).map(v=>v[1])

monthlyPrice = monthlyPrice.map((v,i) => {
  if (i>0) {
    v.priceChange = v.priceMean - monthlyPrice[i-1].priceMean
    v.priceRelativeChange = v.priceChange / monthlyPrice[i-1].priceMean
  }
  return v
})

const yearlyPrice = d3.rollups(dailyPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price)
  }
}, v => v.luxdate.startOf('year')).map(v=>v[1])

fs.writeFileSync(folder + '/output/monthlySolarBenchmarkPrice.csv', d3.csvFormat(monthlyPrice))
fs.writeFileSync(folder + '/output/yearlySolarBenchmarkPrice.csv', d3.csvFormat(yearlyPrice))

