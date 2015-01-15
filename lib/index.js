var express = require('express')
var bodyParser = require('body-parser')
var jsend = require('jsend')

var Addresses = require('./addresses')
//var Blocks = require('./blocks')
//var Transactions = require('./transcations')

function createApp(config) {
  var app = express()

  // parse application/json
  app.use(bodyParser.json())

  // jsend
  app.use(jsend.middleware)

  // common blockchain api
  var addresses = new Addresses(config.postgress, config.network)
  app.post('/addresses/summary', addresses.summary.bind(addresses))
//  app.post('/addresses/summary', addresses.summary.bind(undefined, connString))
//  app.post('/addresses/transactions', addresses.transactions.bind(undefined, connString))
//  app.post('/addresses/unspents', addresses.unspents.bind(undefined, connString))
//
//    var blocks = new Blocks(connString)
//  app.post('/blocks/get', blocks.get.bind(undefined, connString))
//  app.post('/blocks/latest', blocks.latest.bind(undefined, connString))
//  app.post('/blocks/propagate', blocks.propagate.bind(undefined, connString))
//  app.post('/blocks/summary', blocks.summary.bind(undefined, connString))
//
//    var transactions = new Transactions(connString)
//  app.post('/transactions/get', transactions.get.bind(undefined, connString))
//  app.post('/transactions/latest', transactions.latest.bind(undefined, connString))
//  app.post('/transactions/propagate', transactions.propagate.bind(undefined, connString))
//  app.post('/transactions/summary', transactions.summary.bind(undefined, connString))

  return app
}

module.exports = createApp
