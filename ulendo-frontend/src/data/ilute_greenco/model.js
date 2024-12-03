
import { SAPPDAMForecast } from './sapp_forecast.js'
import { plantPerformance } from './plant.js'
import { greenCoPPA } from './greenco_ppa.js'

import { modelParams, greencoParams, plantParams, damForecastParams } from './params.js'

const modelRuns = [...Array(modelParams.runs).keys()].map(v=> {
  return {
    runNo: v+1,
    periods: generatePeriods(modelParams.years)
  }
})

const plantYields = plantPerformance(generatePeriods(modelParams.years), plantParams)

modelRuns.forEach(run => {
  run.marketForecast = SAPPDAMForecast(run, damForecastParams)
  run.ppaModel = greenCoPPA(run, plantYields, greencoParams)
})

// Create an array of monthly periods for the given number of years
function generatePeriods(years, skip=1) {
  //let ret = []
  let count = (years * 12) / skip
  let periods = [...Array(count).keys()]

  let ret = periods.map(p => {
    let period = (p*skip)+1
    let year = Math.floor((period-1) / 12)+1
    return {
      period,
      year,
      discountFactor: 1/(1 + modelParams.discountRate)**(year-1),
      month: (period - year * 12) + 12
    }
  })
  return ret
}

