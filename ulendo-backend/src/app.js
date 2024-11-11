const config = require('./config/config')
const debug = require('debug')('ulendo:app')

process.env.NODE_ENV = config.development_mode ? 'development' : 'production'

const express = require('express')
const app = express()

const http = require('http').Server(app)
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const fileUpload = require("express-fileupload")

const corsOptions = {
  origin: config.cors_origin,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

debug('Starting ulendo api server.')

//app.set('trust proxy', true)
app.use(bodyParser.json())
app.use(fileUpload())
app.use(cors(corsOptions))
//app.options('*', cors())

//app.use('/static', cors(corsOptions), express.static(path.join(__dirname, '/../static')))
app.use(express.static('public'))

app.use((req, res, next) => {
  let dString = req.method + ' ' + req.baseUrl + req.path
  if (req.query) {
    dString += ' Qry: ' + JSON.stringify(req.query)
  }
  if (req.form) {
    dString += ' Frm: ' + JSON.stringify(req.form)
  }  
  debug(dString)

  next()
})

require('./routes')(app)

http.listen(config.port)

debug(`Ulendo api server started on ${config.port}. Development mode: ${config.development_mode}`)
