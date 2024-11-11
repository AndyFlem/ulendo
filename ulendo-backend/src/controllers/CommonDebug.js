const debug = require('debug')('ulendo:controllers')
const config = require('../config/config')
const Luxon = require('luxon')
const DateTime = Luxon.DateTime

function setup (controller) {
  return {
    debug: (req, method, message) => {
      let reqStr = req ? `- params: ${JSON.stringify(req.params)}, query: ${JSON.stringify(req.query)}, form: ${JSON.stringify(req.body)}` : ''
      debug(`${controller}.${method} ${reqStr}: ${message}`)
    },
    error: (req, method, error) => {
      debug(`ERROR ${controller}.${method} - ${error}`)
    }
  }
}

module.exports = setup
