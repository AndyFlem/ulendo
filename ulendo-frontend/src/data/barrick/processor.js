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

const lumwanaDemand_raw = d3.csvParse(fs.readFileSync(folder + '/input/lumwana_demand.csv', 'utf-8'), d3.autoType)
const lumwanaDemand=lumwanaDemand_raw.map(v=>{
  v.year=parseInt(v.year)
  v.demandMW=parseInt(v.demand_mw)
  v.annualEnergyGWh=parseInt(v.demand_mw)*8
  return v
})
fs.writeFileSync(folder + '/output/lumwanaDemand.csv', d3.csvFormat(lumwanaDemand))

const params = {
  capacityWindMW: 120,
  capacitySolarMW: 50
}
fs.writeFileSync(folder + '/output/parameters.json', JSON.stringify(params, null, 2))
