import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon'

const folder = path.dirname(fileURLToPath(import.meta.url))

// Delete all files in the output folder
fs.readdirSync(folder + '/output/dam').forEach(file => {
  fs.unlink(folder + '/output/dam/' + file, (err) => {
    if (err) {
      console.error(err)
    }
  })
})

//############################################################################
// Load hourly
//############################################################################

let hourly = []
const folderPath = path.join(folder, 'input/dam/price_volume')
const files = fs.readdirSync(folderPath)
files.forEach(file => {
  if (path.extname(file) === '.csv') {
    let records = d3.csvParse(fs.readFileSync(path.join(folderPath, file), 'utf-8'), d3.autoType)
    records=records.map(v=>{
      v.dt=DateTime.fromJSDate(v.date).plus({hours: v.hour-2})
      v.datetime = v.dt.toISO()
      return v
    })
    hourly=hourly.concat(records)
  }
})

hourly = hourly.map(h=>{
  h.dayOfWeek = h.dt.weekday
  h.month = h.dt.month
  h.value = h.volume * h.price/1000

  if (h.dayOfWeek==7) { h.category = 'off' }

  if (h.dayOfWeek==6) { if ((h.hour>=7 && h.hour<=11) || (h.hour>=18 && h.hour<=19)) { h.category = 'standard' } else { h.category = 'off' } }

  if (h.dayOfWeek<6) {
    if (h.hour<=5 || h.hour>=22) { h.category = 'off' }
    if (h.hour>=6 && h.hour <=8) { h.category = 'morning' }
    if (h.month<=3) {
      if (h.hour>=9 && h.hour <=18) { h.category = 'standard' }
      if (h.hour>=19 && h.hour <=20) { h.category = 'evening' }
      if (h.hour==21) { h.category = 'standard' }
    }
    if (h.month==4 || h.month==5 || h.month>=9) {
      if (h.hour>=9 && h.hour <=17) { h.category = 'standard' }
      if (h.hour>=18 && h.hour <=19) { h.category = 'evening' }
      if (h.hour>=20 && h.hour <=21) { h.category = 'standard' }
    }
    if (h.month>=6 && h.month<=8) {
      if (h.hour>=9 && h.hour <=16) { h.category = 'standard' }
      if (h.hour>=17 && h.hour <=19) { h.category = 'evening' }
      if (h.hour>=20 && h.hour <=21) { h.category = 'standard' }
    }
  }
  return h
})

//############################################################################
// Daily
//############################################################################

const daily = d3.rollups(hourly, v=>{
  let ret = {
    dt: v[0].dt.startOf('day'),
    datetime: v[0].dt.startOf('day').toISODate(),
    dayOfWeek: v[0].dayOfWeek,
    priceMean: d3.mean(v, d=>d.price).toPrecision(5),
    priceMax: d3.max(v, d=>d.price),
    priceMin: d3.min(v, d=>d.price),
    value: d3.sum(v, d=>d.value).toPrecision(5),

    volumeMWh: d3.sum(v, d=>d.volume).toPrecision(5),
    powerMW: d3.mean(v, d=>d.volume).toPrecision(5),
    powerMaxMW: d3.max(v, d=>d.volume),
    powerMinMW: d3.min(v, d=>d.volume),
  }
  const offHours = v.filter(d=>d.category=='off')
  ret.priceOffMean = d3.mean(offHours, d=>d.price).toPrecision(5)
  ret.priceOffCoefVar = (d3.deviation(offHours, d=>d.price) / ret.priceOffMean).toPrecision(5)
  ret.powerOffMeanMW = d3.mean(offHours, d=>d.volume).toPrecision(5)
  ret.valueOff = d3.sum(offHours, d=>d.value).toPrecision(5)

  if (v[0].dayOfWeek<7) {
    const standardHours = v.filter(d=>d.category=='standard')
    ret.priceStandardMean = d3.mean(standardHours, d=>d.price).toPrecision(5)
    ret.priceStandardCoefVar = (d3.deviation(standardHours, d=>d.price) / ret.priceStandardMean).toPrecision(5)
    ret.powerStandardMeanMW = d3.mean(standardHours, d=>d.volume).toPrecision(5)
    ret.valueStandard = d3.sum(standardHours, d=>d.value).toPrecision(5)
  }

  if (v[0].dayOfWeek<6) {
    const morningHours = v.filter(d=>d.category=='morning')
    ret.priceMorningMean = d3.mean(morningHours, d=>d.price).toPrecision(5)
    ret.priceMorningCoefVar = (d3.deviation(morningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
    ret.powerMorningMeanMW = d3.mean(morningHours, d=>d.volume).toPrecision(5)
    ret.valueMorning = d3.sum(morningHours, d=>d.value).toPrecision(5)

    const eveningHours = v.filter(d=>d.category=='evening')
    ret.priceEveningMean = d3.mean(eveningHours, d=>d.price).toPrecision(5)
    ret.priceEveningCoefVar = (d3.deviation(eveningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
    ret.powerEveningMeanMW = d3.mean(eveningHours, d=>d.volume).toPrecision(5)
    ret.valueEvening = d3.sum(eveningHours, d=>d.value).toPrecision(5)
  }

  return ret
}, d=>d.dt.startOf('day')).map(v=>v[1])


//############################################################################
// Weekly
//############################################################################

const weekly = d3.rollups(hourly, v=>{
  let ret = {
    dt: v[0].dt.endOf('week'),
    datetime: v[0].dt.endOf('week').toISODate(),
    priceMean: d3.mean(v, d=>d.price).toPrecision(5),
    priceWeightedMean: (d3.sum(v, d=>d.value*1000)/d3.sum(v, d=>d.volume)).toPrecision(5),
    priceMax: d3.max(v, d=>d.price),
    priceMin: d3.min(v, d=>d.price),
    volumeMWh: d3.sum(v, d=>d.volume).toPrecision(5),
    value: d3.sum(v, d=>d.value).toPrecision(5),

    powerMeanMW: d3.mean(v, d=>d.volume).toPrecision(5),
    powerMaxMW: d3.max(v, d=>d.volume),
    powerMinMW: d3.min(v, d=>d.volume)
  }
  const offHours = v.filter(d=>d.category=='off')
  ret.priceOffMean = d3.mean(offHours, d=>d.price).toPrecision(5)
  ret.powerOffMeanMW = d3.mean(offHours, d=>d.volume).toPrecision(5)
  ret.valueOff = d3.sum(offHours, d=>d.value).toPrecision(5)

  if (v[0].dayOfWeek<7) {
    const standardHours = v.filter(d=>d.category=='standard')
    ret.priceStandardMean = d3.mean(standardHours, d=>d.price).toPrecision(5)
    ret.powerStandardMeanMW = d3.mean(standardHours, d=>d.volume).toPrecision(5)
    ret.valueStandard = d3.sum(standardHours, d=>d.value).toPrecision(5)
  }

  if (v[0].dayOfWeek<6) {
    const morningHours = v.filter(d=>d.category=='morning')
    ret.priceMorningMean = d3.mean(morningHours, d=>d.price).toPrecision(5)
    ret.powerMorningMeanMW = d3.mean(morningHours, d=>d.volume).toPrecision(5)
    ret.valueMorning = d3.sum(morningHours, d=>d.value).toPrecision(5)

    const eveningHours = v.filter(d=>d.category=='evening')
    ret.priceEveningMean = d3.mean(eveningHours, d=>d.price).toPrecision(5)
    ret.powerEveningMeanMW = d3.mean(eveningHours, d=>d.volume).toPrecision(5)
    ret.valueEvening = d3.sum(eveningHours, d=>d.value).toPrecision(5)
  }

  return ret

}, d=>d.dt.endOf('week')).map(v=>v[1])


//############################################################################
// Monthly
//############################################################################

const monthly = d3.rollups(hourly, v=>{
  let ret = {
    dt: v[0].dt.startOf('month'),
    datetime: v[0].dt.startOf('month').toISODate(),
    year: v[0].dt.year,
    month: v[0].dt.month,
    priceMean: d3.mean(v, d=>d.price).toPrecision(5),
    priceWeightedMean: (d3.sum(v, d=>d.value*1000)/d3.sum(v, d=>d.volume)).toPrecision(5),
    priceMax: d3.max(v, d=>d.price),
    priceMin: d3.min(v, d=>d.price),
    value: d3.sum(v, d=>d.value).toPrecision(5),

    volumeGWh: d3.sum(v, d=>d.volume/1000).toPrecision(5),
    powerMeanMW: d3.mean(v, d=>d.volume).toPrecision(5),
    powerMaxMW: d3.max(v, d=>d.volume),
    powerMinMW: d3.min(v, d=>d.volume),
  }
  const offHours = v.filter(d=>d.category=='off')
  ret.priceOffMean = d3.mean(offHours, d=>d.price).toPrecision(5)
  ret.priceOffCoefVar = (d3.deviation(offHours, d=>d.price) / ret.priceOffMean).toPrecision(5)
  ret.powerOffMeanMW = d3.mean(offHours, d=>d.volume).toPrecision(5)
  ret.valueOff = d3.sum(offHours, d=>d.value).toPrecision(5)
  ret.priceOffWeightedMean = (d3.sum(offHours, d=>d.value*1000)/d3.sum(offHours, d=>d.volume)).toPrecision(5)

  const standardHours = v.filter(d=>d.category=='standard')
  ret.priceStandardMean = d3.mean(standardHours, d=>d.price).toPrecision(5)
  ret.priceStandardCoefVar = (d3.deviation(standardHours, d=>d.price) / ret.priceStandardMean).toPrecision(5)
  ret.powerStandardMeanMW = d3.mean(standardHours, d=>d.volume).toPrecision(5)
  ret.valueStandard = d3.sum(standardHours, d=>d.value).toPrecision(5)
  ret.priceStandardWeightedMean = (d3.sum(standardHours, d=>d.value*1000)/d3.sum(standardHours, d=>d.volume)).toPrecision(5)

  const morningHours = v.filter(d=>d.category=='morning')
  ret.priceMorningMean = d3.mean(morningHours, d=>d.price).toPrecision(5)
  ret.priceMorningCoefVar = (d3.deviation(morningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
  ret.powerMorningMeanMW = d3.mean(morningHours, d=>d.volume).toPrecision(5)
  ret.valueMorning = d3.sum(morningHours, d=>d.value).toPrecision(5)
  ret.priceMorningWeightedMean = (d3.sum(morningHours, d=>d.value*1000)/d3.sum(morningHours, d=>d.volume)).toPrecision(5)

  const eveningHours = v.filter(d=>d.category=='evening')
  ret.priceEveningMean = d3.mean(eveningHours, d=>d.price).toPrecision(5)
  ret.priceEveningCoefVar = (d3.deviation(eveningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
  ret.powerEveningMeanMW = d3.mean(eveningHours, d=>d.volume).toPrecision(5)
  ret.valueEvening = d3.sum(eveningHours, d=>d.value).toPrecision(5)
  ret.priceEveningWeightedMean = (d3.sum(eveningHours, d=>d.value*1000)/d3.sum(eveningHours, d=>d.volume)).toPrecision(5)

  const days = daily.filter(dy => dy.dt.month == v[0].dt.month && dy.dt.year == v[0].dt.year)
  ret.days = days.length

  ret.priceDailyMinMean = d3.min(days, d=>d.priceMean)
  ret.priceDailyMaxMean = d3.max(days, d=>d.priceMean)

  ret.volumeDailyMaxMWh = d3.max(days, d=>d.volumeMWh)
  ret.volumeDailyMinMWh = d3.min(days, d=>d.volumeMWh)

  ret.powerDailyMaxMW = d3.max(days, d=>d.powerMW)
  ret.powerDailyMinMW = d3.min(days, d=>d.powerMW)

  return ret
}, d=>d.dt.startOf('month')).map(v=>v[1])

//############################################################################
// Yearly
//############################################################################

const yearly = d3.rollups(daily, v=>{
  let ret = {
    dt: v[0].dt.startOf('year'),
    datetime: v[0].dt.startOf('year').toISODate(),
    year: v[0].dt.year,
    priceDailyMean: d3.mean(v, d=>d.priceMean).toPrecision(5),
    priceMean: (d3.sum(v, d=>d.value)/d3.sum(v, d=>d.volumeMWh/1000)).toPrecision(5),
    value: d3.sum(v, d=>d.value/1000).toPrecision(5),

    volumeGWh: d3.sum(v, d=>d.volumeMWh/1000).toPrecision(5),
  }
  const months = monthly.filter(m => m.dt.year == v[0].dt.year)
  ret.priceMonthlyMean = d3.mean(months, d=>d.priceMean).toPrecision(5)

  return ret
}, d=>d.dt.startOf('year')).map(v=>v[1])

//############################################################################
// Hourly by calendar month
//############################################################################
let calMonthlyHours = processCalMonthlyHours(hourly)

function processCalMonthlyHours(hours) {
  let mons = Array.from(new Array(12), (x,i) => i+1)

  return mons.map(m=>{
    return d3.rollups(hours.filter(d=>d.dt.month==m), v=>{
      let ret = {
        month: m,
        hour: v[0].dt.hour,
        priceMean: d3.mean(v, d=>d.price).toPrecision(5),
        powerMeanMW: d3.mean(v, d=>d.volume).toPrecision(5),
        priceDeviation: d3.deviation(v, d=>d.price).toPrecision(5),
        powerDeviationMW: d3.deviation(v, d=>d.volume).toPrecision(5),
      }
      ret.priceCoefVar = ret.priceDeviation / ret.priceMean
      ret.powerCoefVar = ret.powerDeviationMW / ret.powerMeanMW
      return ret
    },v=>v.hour).map(v=>v[1])
  })
}

//############################################################################
// Save
//############################################################################

daily.map(v=>{ delete v.dt })
weekly.map(v=>{ delete v.dt })
monthly.map(v=>{ delete v.dt })
yearly.map(v=>{ delete v.dt })

fs.writeFileSync(folder + '/output/dam/dam_hourly.csv', d3.csvFormat(hourly))
fs.writeFileSync(folder + '/output/dam/dam_daily.csv', d3.csvFormat(daily))
fs.writeFileSync(folder + '/output/dam/dam_weekly.csv', d3.csvFormat(weekly))
fs.writeFileSync(folder + '/output/dam/dam_monthly.csv', d3.csvFormat(monthly))
fs.writeFileSync(folder + '/output/dam/dam_yearly.csv', d3.csvFormat(yearly))
