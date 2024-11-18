import * as d3 from 'd3'
import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse, transform } from 'csv'
//import { DateTime } from 'luxon'

const folder = path.dirname(fileURLToPath(import.meta.url))

// Delete all files in the output folder
fs.readdirSync(folder + '/output').forEach(file => {
  fs.unlink(folder + '/output/' + file, (err) => {
    if (err) {
      console.error(err)
    }
  })
})

const records = []
let pointer = 0

const parser = parse({
  delimiter: [';',','],
  relax: true,
  skip_empty_lines: true,
  relax_column_count: true
})

const transformer = transform(record => {
  if(!(record[0].charAt() === '#')){
    record.splice(16)

    if (!(record[0] === 'Date')) {
      records[pointer]=record
      pointer++
      if (pointer==4) {
        let agg = [
          records[0][0],
          records[0][1].slice(0,2) + ':00'
        ]
        for (let i=0; i<14; i++) {
          agg.push(d3.mean(records.map(r=>r[i+2])))
        }

        aggregated.write(agg.join(',') + '\n')
        pointer = 0
      }
    }
    return record
  }
})


const aggregated = fs.createWriteStream(folder + '/output/kalumbila_1hour_irradiation.csv', {encoding: 'ascii'})
aggregated.write('Date,Time,GHI,DNI,DIF,flagR,SE,SA,TEMP,AP,RH,WS,WG,WD,PREC,PWAT\n')

fs.createReadStream(folder + '/input/kalumbila_15min_irradiation.csv')
  .pipe(parser)
  .pipe(transformer)
  .pipe(transform(record => {return record.join(',') + '\n'}))
  .pipe(fs.createWriteStream(folder + '/output/kalumbila_15min_irradiation.csv'))

