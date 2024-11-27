export const modelParams = {
  years:25,
  runs:100
}

export const plantParams = {
  yieldCurve: 'p50',
  capacityMW: 25,
  netFactors: {
    availability: 0.98,
    plannedOutages: 0.998,
    unplannedOutages: 0.995
  },
  degredation: {
    yearOne: 0.02,
    yearPlusOne: 0.0035
  }
}

export const greencoParams = {
  discountRate: 0.1,
  indexation: 2,
  baseTariff: 45,
  adjustmentCapPlus: 40,
  adjustmentCapMinus: 5,
  adjustmentFactorUp: 80,
  adjustmentFactorDown: 80,
  fixedTransactionCost: 15,
  actualTransactionCost: 15,
  buffer: 2.9
}

export const damForecastParams = {
  mean: 81,
  stDev: 13,//Math.round(sds.filter(v=>v.year==2019)[0].sd*10)/10,
  phi:0.74,
  maxPrice:130,
  minPrice: 15,
  SDEscalation:2,
  meanEscalation:2
}
