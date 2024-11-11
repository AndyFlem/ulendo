import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
//import { DateTime } from 'luxon'

const folder = path.dirname(fileURLToPath(import.meta.url))

// Delete all files in the output folder
fs.readdirSync(folder + '/output').forEach(file => {
  fs.unlink(folder + '/output/' + file, (err) => {
    if (err) {
      console.error(err)
    }
  })
})


const catchments = JSON.parse(fs.readFileSync(folder + '/input/catchments.json'))
fs.writeFileSync(folder + '/output/catchments.json', JSON.stringify(catchments, null, 2))

const catchmentsMain = JSON.parse(fs.readFileSync(folder + '/input/catchments_main.json'))
fs.writeFileSync(folder + '/output/catchmentsMain.json', JSON.stringify(catchmentsMain, null, 2))

const vicfallsMonthly = d3.csvParse(fs.readFileSync(folder + '/input/vicfalls_monthly.csv', 'utf-8'), d3.autoType)
fs.writeFileSync(folder + '/output/vicfallsMonthly.csv', d3.csvFormat(vicfallsMonthly))

const vicfallsYearly = d3.rollups(vicfallsMonthly, v => {
  return {
    water_year: v[0].water_year,
    volume: d3.sum(v, l=>l.volume)/1000
  }
}, v=>v.water_year).map(v=>v[1]).filter(v=>v.water_year<2022)
fs.writeFileSync(folder + '/output/vicfallsYearly.csv', d3.csvFormat(vicfallsYearly))

const vicfallsCalmonthly = d3.rollups(vicfallsMonthly,v=>{
  return {
   month: v[0].month,
    water_month: v[0].water_month,
    flow: d3.mean(v, m=>m.flow)
  }
 },v=>v.month).map(v=>v[1]).sort((a,b)=>a.water_month-b.water_month)
 fs.writeFileSync(folder + '/output/vicfallsCalmonthly.csv', d3.csvFormat(vicfallsCalmonthly))

