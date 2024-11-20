import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon'
import { h } from 'vue'

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
const solarCalmonthlyHours = d3.csvParse(fs.readFileSync(folder + '/../zambia_wind_solar/output/solarCalmonthlyHours.csv', 'utf-8'), d3.autoType).map(v=> {
  return v
})


const hourlyWeightedPrice = damHourly.map(v=> {
  const capFactor = solarCalmonthlyHours.find(d=>
    d.month == v.month &&
    d.hour==v.hour).meanHourlyCapFactor

    return {
      date:v.date,
      luxdate: DateTime.fromJSDate(v.date),
      capFactor: capFactor,
      weightedPrice: capFactor * v.price
  }
})

console.log(hourlyWeightedPrice[12])

const dailyPrice = d3.rollups(hourlyWeightedPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    price: d3.sum(v, d => d.weightedPrice)
  }
}, v => v.date).map(v=>v[1])

const monthlyPrice = d3.rollups(dailyPrice, v => {
  return {
    date: v[0].date,
    luxdate: v[0].luxdate,
    priceMean: d3.mean(v, d => d.price)
  }
}, v => v.luxdate.startOf('month')).map(v=>v[1])


console.log(monthlyPrice[0])
