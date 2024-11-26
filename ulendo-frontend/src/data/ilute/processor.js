import * as d3 from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon'

import processHourly from './../library/process_hourly.js'

const folder = path.dirname(fileURLToPath(import.meta.url))

// Delete all files in the output folder
fs.readdirSync(folder + '/output').forEach(file => {
  fs.unlink(folder + '/output/' + file, (err) => {
    if (err) {
      console.error(err)
    }
  })
})


const params = {
  capacitySolarMW: 25,
}
fs.writeFileSync(folder + '/output/parameters.json', JSON.stringify(params, null, 2))

//****************************************************************
// Ilute data processing
//****************************************************************
const iluteHourly = d3.csvParse(fs.readFileSync(folder + '/input/ilute_25mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.kw)/25*params.capacitySolarMW/1000
  v.capFactor = parseFloat(v.kw)/(25*1000)
  return v
})


processHourly(iluteHourly, params.capacitySolarMW, folder, 'ilute')
