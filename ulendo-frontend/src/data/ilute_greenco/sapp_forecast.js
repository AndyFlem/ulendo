import { min, max, mean, sum } from 'd3-array'
import { randomNormal } from 'd3-random'

function SAPPDAMForecast(periods, run, damForecastParams){

  // For each period in the forecast, calculate the mean and StDev
  periods = periods.map(v => {
    v.run = run

    // Calculate the StDev for the period
    v.annualStDev = fSD(v)
    // v.adjustedFirstDifference = randomNormal(0, 1)()
    v.firstDifferenceStDev = randomNormal(0, 1)() * v.annualStDev


    // Calculate the mean: mu - for the period
    if (damForecastParams.meanOverride == base_params.forecast.meanOverride) {
      v.muUnescalated = mean_scenarios.filter(b=>b.ref==damForecastParams.mean_scenario)[0].means[v.year-1]
    } else {
      v.muUnescalated = damForecastParams.meanOverride
    }
    v.mu = v.muUnescalated + (v.muUnescalated * (damForecastParams.escalation / 100) * (v.period/12))

    // Phi - weight of the previous period distance from mean
    v.phi = damForecastParams.phi

    // Min and max price for the period
    v.maxPrice = damForecastParams.maxPrice + (damForecastParams.maxPrice * (damForecastParams.escalation / 100) * (v.period/12))
    v.minPrice = damForecastParams.minPrice + (damForecastParams.minPrice * (damForecastParams.escalation / 100) * (v.period/12))
    return v
  })

  // For each period in the forecast, calculate the forecasted price
  // based on the previous period's price and the mean and standard deviation
  return periods.map((m, i) => {
    // Calculate the distance from the mean
    if (i > 0) {
      let phi1=m.phi
      if (periods[i-1].dist>0) {
        phi1 = phi1 - phi_mod
      }

      m.dist = phi1 * periods[i-1].dist + m.firstDifferenceStDev
    } else {
      m.dist = m.firstDifferenceStDev
    }

    // Cap the distance based on the min and max price
    m.dist = min([m.dist, m.maxPrice - m.mu])
    m.dist = max([m.dist, m.minPrice - m.mu])

    // Calculate the tariff for the period as the sum of the mean and the distance
    m.tariff = m.mu + m.dist
    return m
  })
}

export { SAPPDAMForecast }
