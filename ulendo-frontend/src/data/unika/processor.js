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
  capacityWindMW: 180,
}

fs.writeFileSync(folder + '/output/parameters.json', JSON.stringify(params, null, 2))

//****************************************************************
// Ilute data processing
//****************************************************************
const unikaHourly = d3.csvParse(fs.readFileSync(folder + '/input/unika_180mw_yield.csv', 'utf-8'), d3.autoType).map(v=> {
  v.date=DateTime.fromObject({year:v.year,month:v.month,day:v.day, hour: v.hour})
  v.energyMWh=parseFloat(v.mwh)/180*params.capacityWindMW
  v.capFactor = parseFloat(v.mwh)/180
  return v
})


processHourly(unikaHourly, params.capacityWindMW, folder, 'unika')
