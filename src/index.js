var bitcoin = require('bitcoin')
var express = require('express')
var bodyParser = require('body-parser')
var jsend = require('jsend')

var Addresses = require('./addresses')
var Blocks = require('./blocks')
var Database = require('./db')
var Transactions = require('./transactions')

function createApp(config) {
  var app = express()
  app.requestCount = 0

  // parse application/json
  app.use(bodyParser.json())

  // jsend
  app.use(jsend.middleware)

  // request counter
  app.use(function(req, res, next) {
    app.requestCount += 1
    next()
  })

  // rpc api
  var database = new Database(config.postgres)
  var rpc = new bitcoin.Client(config.rpc)

  // common blockchain api
  var base = '/' + config.version

  var addresses = new Addresses(database, config.network)
  app.post(base + '/addresses/summary', addresses.summary.bind(addresses))
  app.post(base + '/addresses/transactions', addresses.transactions.bind(addresses))
  app.post(base + '/addresses/unspents', addresses.unspents.bind(addresses))

  var blocks = new Blocks(database, rpc)
  app.post(base + '/blocks/get', blocks.get.bind(blocks))
  app.post(base + '/blocks/latest', blocks.latest.bind(blocks))
  app.post(base + '/blocks/propagate', blocks.propagate.bind(blocks))
  app.post(base + '/blocks/summary', blocks.summary.bind(blocks))

  var transactions = new Transactions(database, rpc)
  app.post(base + '/transactions/get', transactions.get.bind(transactions))
  app.post(base + '/transactions/latest', transactions.latest.bind(transactions))
  app.post(base + '/transactions/propagate', transactions.propagate.bind(transactions))
  app.post(base + '/transactions/summary', transactions.summary.bind(transactions))

  // request counter (ignore non API requests)
  app.use(function(req, res, next) {
    app.requestCount -= 1
    next()
  })

  return app
}

module.exports = createApp
