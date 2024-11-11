

nodemon --watch ./src/data/zambia_wind_solar/input --watch ./src/data/zambia_wind_solar/processor.js -e js,csv --verbose ./src/data/zambia_wind_solar/processor.js &

nodemon --watch ./src/data/kariba/input --watch ./src/data/kariba/processor.js -e js,csv --verbose ./src/data/kariba/processor.js &

nodemon --watch ./src/data/barrick/input --watch ./src/data/barrick/processor.js -e js,csv --verbose ./src/data/barrick/processor.js &