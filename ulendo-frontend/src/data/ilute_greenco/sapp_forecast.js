// Uses statistical parameters to generate a forecast for the SAPP DAM price

// Params
//   stDev
//   mean
//   escalation
//   phi
//   maxPrice
//   minPrice

import { min, max} from 'd3-array'
import { randomNormal } from 'd3-random'

function SAPPDAMForecast(run, damForecastParams){

  // For each period in the forecast, calculate the mean and StDev
  const priceForecasts = run.periods.map(v => {
    return {
      period: v.period,
      year: v.year,
      month: v.month
    }
  })

  priceForecasts.map(v => {
    // Calculate the StDev for the period
    v.stDevUnescalated = damForecastParams.stDev
    v.stDev = v.stDevUnescalated + (v.stDevUnescalated * (damForecastParams.SDEscalation / 100) * (v.period / 12))
    v.deviation = randomNormal(0, 1)() * v.stDev

    // Calculate the mean: mu - for the period
    //if (damForecastParams.meanOverride == base_params.forecast.meanOverride) {
    //  v.muUnescalated = mean_scenarios.filter(b=>b.ref==damForecastParams.mean_scenario)[0].means[v.year-1]
    //} else {
    v.muUnescalated = damForecastParams.mean
    //}
    v.mu = v.muUnescalated + (v.muUnescalated * (damForecastParams.meanEscalation / 100) * (v.period/12))

    // Phi - weight of the previous period distance from mean
    v.phi = damForecastParams.phi

    // Min and max price for the period
    v.maxPrice = damForecastParams.maxPrice + (damForecastParams.maxPrice * (damForecastParams.meanEscalation / 100) * (v.period/12))
    v.minPrice = damForecastParams.minPrice + (damForecastParams.minPrice * (damForecastParams.meanEscalation / 100) * (v.period/12))
    return v
  })

  // For each period in the forecast, calculate the forecasted price
  // based on the previous period's price and the mean and standard deviation
  priceForecasts.map((m, i) => {
    // Calculate the distance from the mean
    if (i > 0) {
      //Distance is the the deviation plus the previous period's distance from the mean multiplied by the weight
      m.dist = (m.phi * priceForecasts[i-1].dist) + m.deviation
    } else {
      m.dist = m.deviation
    }

    // Cap the distance based on the min and max price
    m.dist = min([m.dist, m.maxPrice - m.mu])
    m.dist = max([m.dist, m.minPrice - m.mu])

    // Calculate the tariff for the period as the sum of the mean and the distance
    m.price = m.mu + m.dist
    return m
  })
  return priceForecasts
}

export { SAPPDAMForecast }
