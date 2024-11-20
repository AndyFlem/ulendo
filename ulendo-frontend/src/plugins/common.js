import * as d3 from 'd3'

export default {
  install: (app) => {
    app.provide('colors', {
      wind: d3.quantize(d3.interpolateHcl("#2874a6", " #6830de"), 12),
      solar: d3.quantize(d3.interpolateHcl("#e39b00", "#cede30"), 12),
      combined: d3.quantize(d3.interpolateHcl("#922b21", "#797d7f"), 12),
      storage: d3.quantize(d3.interpolateHcl("#2874a6", "#aed6f1"), 12),
      demand: d3.quantize(d3.interpolateHcl("#1e8449", "#45b39d"), 12),
    })

    app.provide('font',{
      family: 'Courier New, monospace',
      size: 13,
      color: '#6f6f6f'
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
