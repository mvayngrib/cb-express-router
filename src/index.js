var async = require('async')
var bitcoin = require('bitcoin')
var bitcoinjs = require('bitcoinjs-lib')
var bodyParser = require('body-parser')
var express = require('express')
var jsend = require('jsend')
var typeforce = require('typeforce')
var types = require('./types')

var Database = require('./db')

function validate(body, networkStr) {
  // validate addresses
  if ('addresses' in body) {
    var network = bitcoinjs.networks[networkStr]

    body.addresses.forEach(function(addressStr) {
      try {
        var address = bitcoinjs.Address.fromBase58Check(addressStr)

        if (address.version !== network.pubKeyHash &&
            address.version !== network.scriptHash) throw new Error('Bad network')
      } catch(e) {
        throw new Error(addressStr + ' is not a valid ' + networkStr + ' address')
      }
    })

  // validate txIds
  } else if ('txIds' in body) {
    body.txIds.forEach(function(txId) {
      if (txId.length === 64) return

      throw new Error(txId + ' is not a valid blockId')
    })

  // validate blockIds
  } else if ('blockIds' in body) {
    body.blockIds.forEach(function(blockId) {
      if (blockId.length === 64) return

      throw new Error(blockId + ' is not a valid blockId')
    })
  }
}

function createRouter(config) {
  var router = express()

  // parse application/json
  router.use(bodyParser.json())

  // jsend
  router.use(jsend.middleware)

  // request counter
  router.requestCount = 0
  router.use(function(req, res, next) {
    router.requestCount += 1
    next()
  })

  // rpc api
  var rpc = new bitcoin.Client(config.rpc)
  var database = new Database(config.postgres)
  var network = config.network

  // common blockchain api
  var base = '/v1'

  // POST route helper function
  function endpoint(route, cbType, callback) {
    router.post(base + route, function(req, res) {
      // validate the inputs
      try {
        typeforce(cbType.arguments, req.body)
        validate(req.body, network)
      } catch (e) {
        return res.jsend.error(e.message)
      }

      callback(req.body, function(err, results) {
        if (err) return res.jsend.error(err.message)

        // debug only
//        typeforce(cbType.expected, results)

        return res.jsend.success(results)
      })
    })
  }

  endpoint('/addresses/summary', types.addresses.summary, function(body, callback) {
    database.addressSummary(body.addresses, callback)
  })
  endpoint('/addresses/transactions', types.addresses.transactions, function(body, callback) {
    database.addressTransactions(body.addresses, body.blockHeight || 0, callback)
  })
  endpoint('/addresses/unspents', types.addresses.unspents, function(body, callback) {
    database.addressUnspents(body.addresses, callback)
  })
  endpoint('/blocks/get', types.blocks.get, function(body, callback) {
    database.blocksGet(body.blockIds, callback)
  })
  endpoint('/blocks/latest', types.blocks.latest, function(body, callback) {
    database.blocksLatest(callback)
  })
  endpoint('/blocks/propagate', types.blocks.propagate, function(body, callback) {
    rpc.submitBlock(body.blockHex, callback)
  })
  endpoint('/blocks/summary', types.blocks.summary, function(body, callback) {
    database.blocksSummary(body.blockIds, callback)
  })
  endpoint('/transactions/get', types.transactions.get, function(body, callback) {
    database.transactionsGet(body.txIds, callback)
  })
  endpoint('/transactions/latest', types.transactions.latest, function(body, callback) {
    database.transactionsLatest(callback)
  })
  endpoint('/transactions/propagate', types.transactions.propagate, function(body, callback) {
    async.mapSeries(body.txHexs, function(txHex, callback2) {
      rpc.sendRawTransaction(txHex, callback2)
    }, callback)
  })
  endpoint('/transactions/summary', types.transactions.summary, function(body, callback) {
    database.transactions(body.txIds, callback)
  })

  // request counter (ignore irrelevant requests)
  router.use(function(req, res, next) {
    router.requestCount -= 1
    next()
  })

  return router
}

module.exports = createRouter
