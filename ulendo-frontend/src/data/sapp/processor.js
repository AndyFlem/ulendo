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
let start = DateTime.now()

let hourly = []
const folderPath = path.join(folder, 'input/price_volume/dam')
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
console.log('Hourly load', DateTime.now() - start , 'ms')

//############################################################################
// Daily
//############################################################################
start = DateTime.now()


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

console.log('Daily', DateTime.now() - start , 'ms')

//############################################################################
// Weekly
//############################################################################
start = DateTime.now()

/*
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
*/
console.log('Weekly', DateTime.now() - start , 'ms')

//############################################################################
// Monthly
//############################################################################
start = DateTime.now()

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

console.log('Monthly', DateTime.now() - start , 'ms')

//############################################################################
// Yearly
//############################################################################
start = DateTime.now()

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

console.log('Yearly', DateTime.now() - start , 'ms')

//############################################################################
// Hourly by calendar month
//############################################################################
start = DateTime.now()

//let calMonthlyHours = processCalMonthlyHours(hourly)
//let calMonthlyHoursFrom2020 = processCalMonthlyHours(hourly.filter(d=>d.dt.year>=2020))
//let calMonthlyHoursTo2020 = processCalMonthlyHours(hourly.filter(d=>d.dt.year<2020))
/*
yearly.map(y=>{
  y.calMonthlyHours = processCalMonthlyHours(hourly.filter(d=>d.dt.year==y.year))
})
*/
function processCalMonthlyHours(hours) {

  let mons = Array.from(new Array(12), (x,i) => i+1)

  mons = mons.map(m=>{
    return d3.rollups(hours.filter(d=>d.dt.month==m), v=>{
      let ret = {
        month: m,
        hour: v[0].dt.hour,
        priceMean: d3.mean(v, d=>d.price).toPrecision(5),
        powerMeanMW: d3.mean(v, d=>d.volume).toPrecision(5),
        priceDeviation: d3.deviation(v, d=>d.price).toPrecision(5),
        powerDeviationMW: d3.deviation(v, d=>d.volume).toPrecision(5),
      }
      ret.priceCoefVar = (ret.priceDeviation / ret.priceMean).toPrecision(5)
      ret.powerCoefVar = (ret.powerDeviationMW / ret.powerMeanMW).toPrecision(5)
      return ret
    },v=>v.hour).map(v=>v[1])
  })
  return mons.flat()
}

console.log('Calmonthly hours', DateTime.now() - start , 'ms')

//############################################################################
// Calendar months
//############################################################################
start = DateTime.now()

//const calMonthly = processCalMonthly(hourly)
//let calMonthlyFrom2020 = processCalMonthly(hourly.filter(d=>d.dt.year>=2020))
//let calMonthlyTo2020 = processCalMonthly(hourly.filter(d=>d.dt.year<2020))

function processCalMonthly(hours) {
  const calmonthly = d3.rollups(hours, v=>{

    let ret = {
      month: v[0].dt.month,
      priceMean: d3.mean(v, d=>d.price).toPrecision(5),
      priceWeightedMean: (d3.sum(v, d=>d.value*1000)/d3.sum(v, d=>d.volume)).toPrecision(5),

      powerMeanMW: d3.mean(v, d=>d.volume).toPrecision(5),

    }
    const offHours = v.filter(d=>d.category=='off')
    ret.priceOffMean = d3.mean(offHours, d=>d.price).toPrecision(5)
    ret.priceOffCoefVar = (d3.deviation(offHours, d=>d.price) / ret.priceOffMean).toPrecision(5)
    ret.powerOffMeanMW = d3.mean(offHours, d=>d.volume).toPrecision(5)
    ret.priceOffWeightedMean = (d3.sum(offHours, d=>d.value*1000)/d3.sum(offHours, d=>d.volume)).toPrecision(5)

    const standardHours = v.filter(d=>d.category=='standard')
    ret.priceStandardMean = d3.mean(standardHours, d=>d.price).toPrecision(5)
    ret.priceStandardCoefVar = (d3.deviation(standardHours, d=>d.price) / ret.priceStandardMean).toPrecision(5)
    ret.powerStandardMeanMW = d3.mean(standardHours, d=>d.volume).toPrecision(5)
    ret.priceStandardWeightedMean = (d3.sum(standardHours, d=>d.value*1000)/d3.sum(standardHours, d=>d.volume)).toPrecision(5)

    const morningHours = v.filter(d=>d.category=='morning')
    ret.priceMorningMean = d3.mean(morningHours, d=>d.price).toPrecision(5)
    ret.priceMorningCoefVar = (d3.deviation(morningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
    ret.powerMorningMeanMW = d3.mean(morningHours, d=>d.volume).toPrecision(5)
    ret.priceMorningWeightedMean = (d3.sum(morningHours, d=>d.value*1000)/d3.sum(morningHours, d=>d.volume)).toPrecision(5)

    const eveningHours = v.filter(d=>d.category=='evening')
    ret.priceEveningMean = d3.mean(eveningHours, d=>d.price).toPrecision(5)
    ret.priceEveningCoefVar = (d3.deviation(eveningHours, d=>d.price) / ret.priceMorningMean).toPrecision(5)
    ret.powerEveningMeanMW = d3.mean(eveningHours, d=>d.volume).toPrecision(5)
    ret.priceEveningWeightedMean = (d3.sum(eveningHours, d=>d.value*1000)/d3.sum(eveningHours, d=>d.volume)).toPrecision(5)

    return ret
  }, d=>d.dt.month).map(v=>v[1])

  return calmonthly
}

console.log('Calmonthly', DateTime.now() - start , 'ms')

//############################################################################
// Save
//############################################################################
start = DateTime.now()

daily.map(v=>{ delete v.dt })
//weekly.map(v=>{ delete v.dt })
monthly.map(v=>{ delete v.dt })
yearly.map(v=>{ delete v.dt })

/*
yearly.map(y=>{
  fs.writeFileSync(folder + `/output/dam/dam_calmonthlyhours_${ y.year }.csv`, d3.csvFormat(y.calMonthlyHours))
  delete y.calMonthlyHours
})
  */
fs.writeFileSync(folder + '/output/dam/dam_hourly.csv', d3.csvFormat(hourly))
fs.writeFileSync(folder + '/output/dam/dam_daily.csv', d3.csvFormat(daily))
//fs.writeFileSync(folder + '/output/dam/dam_weekly.csv', d3.csvFormat(weekly))
fs.writeFileSync(folder + '/output/dam/dam_monthly.csv', d3.csvFormat(monthly))
fs.writeFileSync(folder + '/output/dam/dam_yearly.csv', d3.csvFormat(yearly))
/*
fs.writeFileSync(folder + '/output/dam/dam_calmonthly.csv', d3.csvFormat(calMonthly))
fs.writeFileSync(folder + '/output/dam/dam_calmonthly_From2020.csv', d3.csvFormat(calMonthlyFrom2020))
fs.writeFileSync(folder + '/output/dam/dam_calmonthly_To2020.csv', d3.csvFormat(calMonthlyTo2020))
fs.writeFileSync(folder + '/output/dam/dam_calmonthlyhours.csv', d3.csvFormat(calMonthlyHours))
fs.writeFileSync(folder + '/output/dam/dam_calmonthlyhours_From2020.csv', d3.csvFormat(calMonthlyHoursFrom2020))
fs.writeFileSync(folder + '/output/dam/dam_calmonthlyhours_To2020.csv', d3.csvFormat(calMonthlyHoursTo2020))
*/

console.log('Save files', DateTime.now() - start , 'ms')

//############################################################################
//Load Flows
//############################################################################
start = DateTime.now()

let flowsRaw = []
const folderPathFlow = path.join(folder, 'input/flow/dam')
const flowFiles = fs.readdirSync(folderPathFlow)

let hourlyPointer = 0

flowFiles.forEach(file => {
  if (path.extname(file) === '.json') {
    let records = JSON.parse(fs.readFileSync(path.join(folderPathFlow, file), 'utf-8'))
    records=records.map(v => {
      v.dt=DateTime.fromISO(v.date).plus({hours: v.hour})
      v.datetime = v.dt.toISO()

      while (v.datetime!=hourly[hourlyPointer].datetime) {  hourlyPointer += 1 }
      v.price = hourly[hourlyPointer].price
      v.category = hourly[hourlyPointer].category

      v.value = v.price * v.flow
      return v
    })
    flowsRaw=flowsRaw.concat(records)
  }
})

console.log('Load raw flows', DateTime.now() - start , 'ms')

//############################################################################
//Process Flow Nodes
//############################################################################
start = DateTime.now()

const flowTo = flowsRaw.map(f=>{
  return {
    date: f.date,
    hour: f.hour,
    flow: f.flow,
    dt: f.dt,
    datetime: f.datetime,
    //price: f.price,
    value: f.value,
    node: f.to,
    side: 'consume',
    category: f.category
  }
})

const flowFrom = flowsRaw.map(f=>{
  return {
    dt: f.dt,
    datetime: f.datetime,
    date: f.date,
    hour: f.hour,
    flow: -f.flow,
    //price: f.price,
    value: -f.value,
    node: f.from,
    side: 'supply',
    category: f.category
  }
})

let flows=flowTo.concat(flowFrom)

flows = flows.map(f=>{
  if (f.node=='ZIMA') { f.node='ZIM' }
  if (f.node=='MOZN_EDM') { f.node='MOZ' }
  if (f.node=='MOZN_HCB') { f.node='HCB' }
  if (f.node=='MOZS') { f.node='MOZ' }
  if (f.node=='RSAS') { f.node='RSA' }
  if (f.node=='RSAN') { f.node='RSA' }

  return f
})

console.log('Process flow nodes', DateTime.now() - start , 'ms')

//############################################################################
//Net out transit flows
//############################################################################
start = DateTime.now()
let bots = flows.filter(f=>f.node=='BOT' && f.dt.year==2016 && f.dt.month==1 && f.dt.hour==6)
console.log(bots)

const flowsNet = d3.rollups(flows, f=>{
  let ret = {
      dt: f[0].dt,
      datetime: f[0].datetime,
      date: f[0].date,
      hour: f[0].hour,
      flow: d3.sum(f, v=>v.flow),
      //price: f[0].price
      value: d3.sum(f, v=>v.value),
      category: f[0].category,
      node: f[0].node
  }
  ret.price = ret.value / ret.flow
  ret.flow <0 ? ret.side = 'supply' : ret.side = 'consume'
  return ret
}, d=>d.node + d.category + d.dt.toISO()).map(v=>v[1]).filter(v=>v.value!=0)


console.log('Net off flows', DateTime.now() - start , 'ms')

//############################################################################
//Monthly flows
//############################################################################
start = DateTime.now()

const flowsMonthly = d3.rollups(flowsNet, f=>{
  let ret = {
    month: f[0].dt.month,
    year: f[0].dt.year,
    node: f[0].node,
    flow: d3.sum(f, v=>v.flow),
    value: d3.sum(f, v=>v.value),
    side: f[0].side,
    category: f[0].category,
    key: f[0].dt.startOf('month').toISODate() + f[0].node + f[0].category + f[0].side
  }
  ret.price=ret.value/ret.flow
  return ret
}, d => d.dt.startOf('month').toISODate() + d.node + d.category+ d.side).map(v=>v[1]).sort((a,b)=>a.key.localeCompare(b.key))


fs.writeFileSync(folder + '/output/dam/dam_flows_monthly.csv', d3.csvFormat(flowsMonthly))
