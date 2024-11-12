//Open the csv file at D:\temp\SG-95101.csv
// Take 4 rows at a time
// Take the mean of the 4 rows
// Save the result

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { createWriteStream } = require('fs');
const { Transform } = require('stream');

const input = fs.createReadStream('D:/temp/SG-95101.csv');
const output = fs.createWriteStream('D:/temp/SG-95101-mean.csv');

const transformer = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
        const values = Object.values(chunk);
        const mean = values.reduce((acc, v) => acc + parseFloat(v), 0) / values.length;
        callback(null, { mean });
    }
    });

input.pipe(csv()).pipe(transformer).pipe(csv.format()).pipe(output);

