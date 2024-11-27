
import { SAPPDAMForecast } from './sapp_forecast.js'
import { plantPerformance } from './plant.js'
import { greenCoPPA } from './greenco_ppa.js'

import { modelParams, greencoParams, plantParams, damForecastParams } from './params.js'

const periods = generatePeriods(modelParams.years)

const modelRuns = [...Array(modelParams.runs).keys()].map(v=> {
  return {
    runNo: v+1
  }
})

const plantYields = plantPerformance(periods, plantParams)


modelRuns.forEach(run => {
  run.marketForecast = SAPPDAMForecast(periods, run, damForecastParams)
  run.greenCoPPA = greenCoPPA(periods, run.marketForecast, plantYields, greencoParams)
})

console.log(modelRuns[0].marketForecast[0])

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
      //discount_factor: 1/(1 + discountRate)**(year-1),
      month: (period - year * 12) + 12
    }
  })
  return ret
}

