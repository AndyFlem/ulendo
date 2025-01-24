/* eslint-disable no-loss-of-precision */
import * as d3 from 'd3'
import fs from 'fs'

const monthDays=[31,28,31,30,31,30,31,31,30,31,30,31]

export default function processHourly(hourly, capacityMW, folder, filePrefix) {

  const diurnal = d3.rollups(hourly,v=>{
    let ret = {
      hour: v[0].hour,
      meanCapFactor: (d3.mean(v,h=>h.capFactor)),
      meanEnergyMWh: (d3.mean(v,h=>h.energyMWh)),
      p90EnergyMWh: d3.quantile(v, 0.9, h=>h.energyMWh),
      p10EneryMWh: d3.quantile(v, 0.1, h=>h.energyMWh),
      p75EnergyMWh: d3.quantile(v, 0.75, h=>h.energyMWh),
      p25EneryMWh: d3.quantile(v, 0.25, h=>h.energyMWh),
    }
    ret.meanSpecificYield = ret.meanCapFactor * 24

    return ret
  }, v=>v.hour).map(v=>v[1])

  const daily_tmp = d3.rollups(hourly,v=>{
    let ret = {
      date: v[0].date,
      year: v[0].year,
      month: v[0].month,
      day: v[0].day,
      capFactor: d3.sum(v,h=>h.capFactor)/24,
      energyMWh: d3.sum(v,h=>h.energyMWh)
    }
    ret.specificYield = ret.capFactor * 24

    return ret
  }, v=>v.date.startOf('day')).map(v=>v[1])

  const weatherFreeCalMonthly = d3.rollups(daily_tmp, d => {
    let ret =  {
      month: d[0].date.month,
      weatherFreeCapFactor: d3.max(d, v=>v.capFactor),
    }
    return ret
  }, d => d.date.month).map(v=>v[1])


  const daily = daily_tmp.map(v=>{
    const wf = weatherFreeCalMonthly.find(c=>c.month==v.date.month).weatherFreeCapFactor
    v.weatherImpact = (v.capFactor - wf)/wf
    return v
  })

  const monthly = d3.rollups(daily, d => {
    let ret =  {
      date: d[0].date.startOf('month'),
      datetime: d[0].date.toISO(),
      year: d[0].date.year,
      month: d[0].date.month,
      meanDailyWeatherImpact: d3.mean(d, v=>v.weatherImpact),
      meanDailyCapFactor: d3.mean(d, v=>v.capFactor),
      specificYield: d3.sum(d, v => v.capFactor * 24),  //MWh/MW
      energyMWh: d3.sum(d, v=>v.energyMWh),
      meanDailyEnergyMWh: d3.mean(d, v=>v.energyMWh),
      p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.energyMWh),
      p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.energyMWh),
      stdevDailyEnergyMWh: d3.deviation(d, v=>v.energyMWh)
    }
    ret.coefVarDailyEnergy = ret.stdevDailyEnergyMWh/ret.meanDailyEnergyMWh
    return ret
  }, d => d.date.startOf('month')).map(v=>v[1])

  const yearly_tmp = d3.rollups(monthly, d => {
    return {
      year: d[0].year,
      specificYield: d3.sum(d,v=>v.specificYield),
      energyMWh: d3.sum(d,v=>v.energyMWh),
      meanDailyWeatherImpact: d3.mean(d, v=>v.meanDailyWeatherImpact),
    }
  }, d => d.year).map(v=>v[1])

  const medianAnnualSpecificYield=d3.median(yearly_tmp, v => v.specificYield)

  const yearly = yearly_tmp.map(v=>{
    v.normalisedSpecificYield = v.specificYield / medianAnnualSpecificYield
    return v
  })

  const calmonthly = d3.rollups(daily, d  => {
    let ret =  {
      date: d[0].date,
      month: d[0].month,

      meanDailyWeatherImpact: d3.mean(d, v=>v.weatherImpact),
      p90DailyCapFactor: d3.quantile(d, 0.9, v=>v.capFactor),
      p10DailyCapFactor: d3.quantile(d, 0.1, v=>v.capFactor),
      maxDailyCapFactor: d3.max(d, v=>v.capFactor),
      meanDailyCapFactor: d3.mean(d, v=>v.capFactor),
      maxDailySpecificYield: d3.max(d, v=>v.specificYield),
      p90DailySpecificYield: d3.quantile(d, 0.9, v=>v.specificYield),
      p10DailySpecificYield: d3.quantile(d, 0.1, v=>v.specificYield),
      meanDailySpecificYield: d3.mean(d, v=>v.specificYield),
      medianDailySpecificYield: d3.quantile(d, 0.5, v=>v.specificYield),

      p90DailyEnergyMWh: d3.quantile(d, 0.9, v=>v.energyMWh),
      p10DailyEnergyMWh: d3.quantile(d, 0.1, v=>v.energyMWh),
      meanDailyEnergyMWh: d3.mean(d, v=>v.energyMWh),
      medianDailyEnergyMWh: d3.median(d, v=>v.energyMWh),
      coefVarDailyEnergy: d3.deviation(d, v=>v.energyMWh)/d3.mean(d, v=>v.energyMWh),
    }
    ret.meanMonthlyEnergyMWh = d3.mean(monthly.filter(v=>v.month==d[0].month), v=>v.energyMWh)
    ret.medianMonthlyEnergyMWh = d3.median(monthly.filter(v=>v.month==d[0].month), v=>v.energyMWh)
    ret.p90MonthlyEnergyMWh = d3.quantile(monthly.filter(v=>v.month==d[0].month), 0.9, v=>v.energyMWh)
    ret.p10MonthlyEnergyMWh = d3.quantile(monthly.filter(v=>v.month==d[0].month), 0.1, v=>v.energyMWh)

    ret.maxMonthlySpecificYield = ret.maxDailySpecificYield * monthDays[ret.month-1]//MWh/MW taking account of seasonality
    ret.meanMonthlySpecificYield = d3.mean(monthly.filter(v=>v.month==d[0].month),v=>v.specificYield)
    ret.medianMonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.5,v=>v.specificYield)
    ret.p90MonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.9,v=>v.specificYield)
    ret.p10MonthlySpecificYield = d3.quantile(monthly.filter(v=>v.month==d[0].month),0.1,v=>v.specificYield)


    return ret
  }, d => d.month).map(v=>v[1])

  const calmonthlyHours = (() => {
    let mons = Array.from(new Array(12), (x,i) => i+1)

    return mons.map(m=>{
      return d3.rollups(hourly.filter(d=>d.month==m), v=>{
        return {
          month: m,
          hour: v[0].hour,
          meanHourlyCapFactor: d3.mean(v,l=>l.capFactor),
          medianHourlyCapFactor: d3.median(v,l=>l.capFactor),
          p90HourlyCapFactor: d3.quantile(v, 0.9, l=>l.capFactor),
          p10HourlyCapFactor: d3.quantile(v, 0.1, l=>l.capFactor),
          meanHourlyEnergyMWh: d3.mean(v,l=>l.energyMWh),
          medianHourlyEnergyMWh: d3.median(v,l=>l.energyMWh),
          p90HourlyEnergyMWh: d3.quantile(v, 0.9, l=>l.energyMWh),
          p10HourlyEnergyMWh: d3.quantile(v, 0.1, l=>l.energyMWh),

        }
      },v=>v.hour).map(v=>v[1])
    })
  })()

  const annualExceedance=Array.from(new Array(11), (x,i) => {
    const ex = 1-(i/10)
    return {
      exceedance: 1-ex,
      energyMWh: d3.quantile(yearly, ex, v=>v.energyMWh),
      specificYield: d3.quantile(yearly, ex, v=>v.specificYield),
      normalisedSpecificYield: d3.quantile(yearly, ex, v=>v.normalisedSpecificYield)
    }
  })

  const durationVariability = (()=>{
    let durations = [5, 10, 15, 18, 20, 25]

    let stDev = d3.deviation(yearly,v=>v.energyMWh)
    let mean = d3.mean(yearly,v=>v.energyMWh)

    return durations.map(d=>{
      return {
        duration_years: d,
        stDev: stDev/Math.sqrt(d),
        p50: d3.median(yearly,v=>v.energyMWh),
        p75: normalinv(0.25, mean, stDev/Math.sqrt(d)),
        p90: normalinv(0.10, mean, stDev/Math.sqrt(d)),
        p99: normalinv(0.01, mean, stDev/Math.sqrt(d))
      }
    })

  })()

  const statistics = [{
    years: yearly.length,
    months: monthly.length,
    capacity: capacityMW,
    medianAnnualEnergyMWh: d3.median(yearly, v=>v.energyMWh),
    meanAnnualEnergyMWh: d3.mean(yearly, v=>v.energyMWh),
    meanAnnualCapFactor: d3.mean(yearly, v=>v.energyMWh)/(24*365*capacityMW),
    meanDailyWeatherImpact: d3.mean(yearly, v=>v.meanDailyWeatherImpact),

    p95AnnualEnergyMWh: d3.quantile(yearly, 0.95, v=>v.energyMWh),
    p90AnnualEnergyMWh: d3.quantile(yearly, 0.9, v=>v.energyMWh),
    p75AnnualEnergyMWh: d3.quantile(yearly, 0.75, v=>v.energyMWh),
    p25AnnualEnergyMWh: d3.quantile(yearly, 0.25, v=>v.energyMWh),
    p10AnnualEnergyMWh: d3.quantile(yearly, 0.1, v=>v.energyMWh),
    p05AnnualEnergyMWh: d3.quantile(yearly, 0.05, v=>v.energyMWh),
    medianAnnualSpecificYield: medianAnnualSpecificYield,
    meanAnnualSpecificYield: d3.mean(yearly, v => v.specificYield),
    coefVarAnnualEnergy: d3.deviation(yearly, v=>v.energyMWh)/d3.mean(yearly, v=>v.energyMWh),
  }]


  fs.writeFileSync(folder + `/output/${filePrefix}Hourly.csv`, d3.csvFormat(hourly))
  fs.writeFileSync(folder + `/output/${filePrefix}Daily.csv`, d3.csvFormat(daily))
  fs.writeFileSync(folder + `/output/${filePrefix}Diurnal.csv`, d3.csvFormat(diurnal))
  fs.writeFileSync(folder + `/output/${filePrefix}Monthly.csv`, d3.csvFormat(monthly))

  fs.writeFileSync(folder + `/output/${filePrefix}Yearly.csv`, d3.csvFormat(yearly))
  fs.writeFileSync(folder + `/output/${filePrefix}Calmonthly.csv`, d3.csvFormat(calmonthly))
  fs.writeFileSync(folder + `/output/${filePrefix}WeatherFreeCalMonthly.csv`, d3.csvFormat(weatherFreeCalMonthly))
  fs.writeFileSync(folder + `/output/${filePrefix}CalmonthlyHours.csv`, d3.csvFormat(calmonthlyHours.flat()))
  fs.writeFileSync(folder + `/output/${filePrefix}AnnualExceedance.csv`, d3.csvFormat(annualExceedance))
  fs.writeFileSync(folder + `/output/${filePrefix}DurationVariability.csv`, d3.csvFormat(durationVariability))
  fs.writeFileSync(folder + `/output/${filePrefix}Statistics.csv`, d3.csvFormat(statistics))

}

function normalinv(p, mean, std) {
  return -1.41421356237309505 * std * erfcinv(2 * p) + mean;

  function erfcinv(p) {
    var j = 0;
    var x, err, t, pp;
    if (p >= 2)
      return -100;
    if (p <= 0)
      return 100;
    pp = (p < 1) ? p : 2 - p;
    t = Math.sqrt(-2 * Math.log(pp / 2));
    x = -0.70711 * ((2.30753 + t * 0.27061) /
      (1 + t * (0.99229 + t * 0.04481)) - t);
    for (; j < 2; j++) {
      err = erfc(x) - pp;
      x += err / (1.12837916709551257 * Math.exp(-x * x) - x * err);
    }
    return (p < 1) ? x : -x;
  }

  function erfc(x) {
    return 1 - erf(x);
  }

  function erf(x) {
    var cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
      -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
      4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
      1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
      6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
      -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
      -6.886027e-12, 8.94487e-13, 3.13092e-13,
      -1.12708e-13, 3.81e-16, 7.106e-15,
      -1.523e-15, -9.4e-17, 1.21e-16,
      -2.8e-17
    ];
    var j = cof.length - 1;
    var isneg = false;
    var d = 0;
    var dd = 0;
    var t, ty, tmp, res;

    if (x < 0) {
      x = -x;
      isneg = true;
    }

    t = 2 / (2 + x);
    ty = 4 * t - 2;

    for (; j > 0; j--) {
      tmp = d;
      d = ty * d - dd + cof[j];
      dd = tmp;
    }

    res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
    return isneg ? res - 1 : 1 - res;
  }
}
