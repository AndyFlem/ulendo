
// Create an array of monthly periods for the given number of years

function periods(years, skip=1) {
  //let ret = []
  let count = (years * 12) / skip
  let periods = [...Array(count).keys()]

  let ret = periods.map(p => {
    let periodNo = (p*skip)+1
    let year = Math.floor((periodNo-1) / 12)+1
    return {
      periodNo,
      year,
      //discount_factor: 1/(1 + discountRate)**(year-1),
      month: (periodNo - year * 12) + 12
    }
  })
  return ret
}

export { periods }
