var bitcoin = require('bitcoin')
var express = require('express')
var bodyParser = require('body-parser')
var jsend = require('jsend')

var Addresses = require('./addresses')
//var Blocks = require('./blocks')
var Transactions = require('./transactions')

function createApp(config) {
  var app = express()

  // parse application/json
  app.use(bodyParser.json())

  // jsend
  app.use(jsend.middleware)

  // rpc api
  var rpc = new bitcoin.Client(config.rpc)

  // common blockchain api
  var addresses = new Addresses(config.postgres, config.network)
  app.post('/addresses/summary', addresses.summary.bind(addresses))
  app.post('/addresses/transactions', addresses.transactions.bind(addresses))
  app.post('/addresses/unspents', addresses.unspents.bind(addresses))

//    var blocks = new Blocks(config.postgres, rpc)
//  app.post('/blocks/get', blocks.get.bind(blocks))
//  app.post('/blocks/latest', blocks.latest.bind(blocks))
//  app.post('/blocks/propagate', blocks.propagate.bind(blocks))

  var transactions = new Transactions(config.postgres, rpc)
  app.post('/transactions/get', transactions.get.bind(transactions))
//  app.post('/transactions/latest', transactions.latest.bind(transactions))
  app.post('/transactions/propagate', transactions.propagate.bind(transactions))
//  app.post('/transactions/summary', transactions.summary.bind(transactions))

  return app
}

module.exports = createApp
