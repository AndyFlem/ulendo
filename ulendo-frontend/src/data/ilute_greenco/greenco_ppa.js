// Takes a a time series of SAPP price forecasts
// and GreenCo PPA parameters and returns various cashflows and account positions

// GreenCo Model Parameters:
//  bufferSize: the size of the buffer in 000s of USD
//  indexation:

//  -- Folowwing marked * are subject to indexation --
//  baseTariff*:
//  fixedTransactionCost*:
//  actualTransactionCost*:
//  adjustmentCapMinus*:
//  adjustmentCapPlus*:

//  -- No indexation
//  adjustmentFactorUp:
//  adjustmentFactorDown:


import { min, max, mean, sum } from 'd3-array'

function GreenCoPPA(periods, marketPrices, plantPerformance, modelRun, greencoParams) {
  // let periods = fPeriods(params.forecast.years)
  // ToDo: Take periods from marketPrices

  // Buffer starts with the full buffer size
  let bufferBalance = greencoParams.bufferSize

  // For each period, calculate the cashflows and buffer movements
  periods.map((p, i) => {

    // =========================================================================================================
    // Copy in some values
    // From the plant model
    p.modelRun=modelRun
    p.yieldDegradedNet = plantPerformance[i].yieldDegradedNet
    p.yieldUndegradedGross = plantPerformance[i].yieldUndegradedGross
    p.yieldUndegradedNet = plantPerformance[i].yieldUndegradedNet

    // From the market model
    // ToDo: Do these need to be here?
    p.mu = marketPrices[i].mu
    p.sd = marketPrices[i].annualStDev

    p.benchmarkPrice = marketPrices[i].price

    // =========================================================================================================
    // GreenCo model

    p.indexFactor = (1 + (greencoParams.indexation / 100)) ** (p.period / 12)
    p.baseTariff = greencoParams.baseTariff * p.indexFactor

    p.fixedTransactionCost = greencoParams.fixedTransactionCost * p.indexFactor
    p.referenceTariff = p.baseTariff + p.fixedTransactionCost

    p.adjustmentRangeLower = - (greencoParams.adjustmentCapMinus * p.indexFactor)
    p.adjustmentRangeUpper = greencoParams.adjustmentCapPlus * p.indexFactor
    if (p.referenceTariff > p.baseTariff) {
      p.adjustmentFactor = greencoParams.adjustmentFactorUp
    } else {
      p.adjustmentFactor = greencoParams.adjustmentFactorDown
    }
    p.tariffDifference = (p.benchmarkPrice - p.referenceTariff)
    p.tariffAdjustment = (p.adjustmentFactor / 100) * p.tariffDifference
    p.tariffAdjustmentCapped = max([p.tariffAdjustment, p.adjustmentRangeLower ])
    p.tariffAdjustmentCapped = min([p.tariffAdjustmentCapped, p.adjustmentRangeUpper ])

    p.applicableTariff = p.baseTariff + p.tariffAdjustmentCapped

    // =========================================================================================================
    // Cashflows and buffer movements
    p.greenco_gross_revenue = p.yieldDegradedNet * p.benchmarkPrice
    p.actualTransactionCost = greencoParams.actualTransactionCost  * p.indexFactor
    p.transactionCost = p.yieldDegradedNet * p.actualTransactionCost
    p.greencoNetRevenue = p.greenco_gross_revenue - p.transactionCost
    p.projectcoInvoiced = p.yieldDegradedNet * p.applicableTariff

    if (p.greencoNetRevenue > p.projectcoInvoiced) {
      // Revenue exceeds cost, no buffer drawdown, buffer replenishment if necassary
      p.projectcoPayment = p.projectcoInvoiced
      p.bufferDrawdown = 0
      p.greencoDefecit = 0
      if (bufferBalance < greencoParams.bufferSize) {
        p.bufferRecharge = min([p.greencoNetRevenue - p.projectcoInvoiced, greencoParams.bufferSize - bufferBalance])
      } else {
        p.bufferRecharge = 0
      }
      p.greencoMargin = p.greencoNetRevenue - p.projectcoInvoiced - p.bufferRecharge
      bufferBalance += p.bufferRecharge
    } else {
      // Cost exceeds revenue, buffer drawdown
      p.greencoDefecit = p.projectcoInvoiced - p.greencoNetRevenue
      p.bufferDrawdown = min([p.greencoDefecit, bufferBalance])
      p.projectcoPayment = min([p.projectcoInvoiced, bufferBalance + p.greencoNetRevenue])
      p.bufferRecharge = 0

      p.greencoMargin = 0
      bufferBalance -= p.bufferDrawdown
    }
    p.projectcoTariffAchieved = p.projectcoPayment / p.yieldDegradedNet
    p.greencoSpecificMargin = p.greencoMargin / p.yieldDegradedNet
    p.bufferBalance = bufferBalance
    p.bufferBalance_pct = p.bufferBalance / greencoParams.bufferSize
  })

  // Return the model run and some summary statistics
  return {
    modelRun: modelRun,
    bufferDrawdownMonths: periods.filter(v => v.bufferDrawdown > 0).length / periods.length,
    bufferZeroMonths: periods.filter(v => v.bufferBalance==0).length / periods.length,
    firstPeriodBufferZero: min(periods.filter(v => v.bufferBalance==0), v => v.period),
    projectcoDefecitMonths: periods.filter(v => v.projectcoPayment < v.projectcoInvoiced).length/periods.length,
    projectcoTariffAchieved: mean(periods, v => v.projectcoTariffAchieved),
    // projectcoPayment: d3.mean(periods, v => v.projectcoPayment),
    // greencoMargin: d3.mean(periods, v => v.greencoMargin),
    // bufferBalance: d3.mean(periods, v => v.bufferBalance),
    projectcoNPV: sum(periods,v=>v.projectcoPayment*v.discount_factor),
    greencoNPV: sum(periods,v=>v.greencoMargin*v.discount_factor),
    periods: periods
  }
}

export { GreenCoPPA }
