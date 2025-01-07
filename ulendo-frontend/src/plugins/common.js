import * as d3 from 'd3'
import {schemeCategory10} from 'd3-scale-chromatic'

export default {
  install: (app) => {

    app.provide('sappDAMCategories', {
      Evening: { index: 3, name: 'Evening', ref: 'Evening', long_name: 'Evening Peak', color: schemeCategory10[3]},
      Morning: { index: 1, name: 'Morning', ref: 'Morning', long_name: 'Morning Peak', color: schemeCategory10[1]},
      Standard: {index: 2, name: 'Standard', ref: 'Standard', long_name: 'Daytime Standard', color: schemeCategory10[2]},
      Off: {index: 0, name: 'Off-peak', ref: 'Off', long_name: 'Night Off-peak', color: schemeCategory10[0]},
    })

    app.provide('colors', {
      wind: d3.quantize(d3.interpolateHcl("#2874a6", " #6830de"), 12),
      solar: d3.quantize(d3.interpolateHcl("#e39b00", "#cede30"), 12),
      combined: d3.quantize(d3.interpolateHcl("#922b21", "#797d7f"), 12),
      storage: d3.quantize(d3.interpolateHcl("#16a085", "#aed6f1"), 12),
      demand: d3.quantize(d3.interpolateHcl("#1e8449", "#45b39d"), 12),
    })

    app.provide('font',(smAndUp)=>{
      console.log('smAndUp',smAndUp)
        return {
        family: 'Courier New, monospace',
        size: smAndUp.value?13:11,
        color: '#6f6f6f'
      }
    })

    app.provide('makeTrans', (col,opacity) => {
      let c=d3.color(col)
      c.opacity=opacity
      return c.formatRgb()
    })

    app.provide('months',
      ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    )
  }
}
