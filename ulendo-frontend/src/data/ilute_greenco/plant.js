
import {csvParse, autoType } from 'd3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const folder = path.dirname(fileURLToPath(import.meta.url))
const iluteCalmonthly = csvParse(fs.readFileSync(folder + '/../ilute/output/iluteCalmonthly.csv', 'utf-8'), autoType).map(v=> {
  return v
})


function plantPerformance(periods, plantParams) {

  plantParams.plantNettingFactor = plantParams.netFactors.availability * plantParams.netFactors.plannedOutages * plantParams.netFactors.unplannedOutages

  periods.map(p => {
    p.degredation = degredation(p.year, p.month)

    p.yieldUndegradedGross = iluteCalmonthly[p.month-1].meanMonthlyEnergyMWh
    p.yieldUndegradedNet = p.yieldUndegradedGross * plantParams.plantNettingFactor
    p.yieldDegradedNet = p.yieldUndegradedNet * p.degredation
    p.specificYield = p.yieldDegradedNet / plantParams.capacityMW
  })

  function degredation(year, month) {
    if (year === 1) {
      return 1 - plantParams.degredation.yearOne/12*month
    } else {
      return 1 - (plantParams.degredation.yearOne + (plantParams.degredation.yearPlusOne * (year - 2)) + (plantParams.degredation.yearPlusOne/12*month))
    }
  }

  return periods
}




export {  plantPerformance }
