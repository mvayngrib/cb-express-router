var async = require('async')
var bitcoinjs = require('bitcoinjs-lib')
var bodyParser = require('body-parser')
var express = require('express')
var jsend = require('jsend')
var typeforce = require('typeforce')
var types = require('./types')

function validate (body, networkName) {
  // validate addresses
  if ('addresses' in body) {
    var network = bitcoinjs.networks[networkName]

    body.addresses.forEach(function (addressStr) {
      try {
        var address = bitcoinjs.Address.fromBase58Check(addressStr)

        if (address.version !== network.pubKeyHash &&
          address.version !== network.scriptHash) throw new Error('Bad network')
      } catch(e) {
        throw new Error(addressStr + ' is not a valid ' + networkName + ' address')
      }
    })

  // validate txIds
  } else if ('txIds' in body) {
    body.txIds.forEach(function (txId) {
      if (txId.length === 64) return

      throw new Error(txId + ' is not a valid txId')
    })

  // validate blockIds
  } else if ('blockIds' in body) {
    body.blockIds.forEach(function (blockId) {
      if (blockId.length === 64) return

      throw new Error(blockId + ' is not a valid blockId')
    })
  }
}

function createRouter (api, networkName) {
  var router = express()

  // parse application/json
  router.use(bodyParser.json())

  // jsend
  router.use(jsend.middleware)

  // POST route helper function
  function endpoint (route, cbType, callback) {
    router.post(route, function (req, res) {
      // validate the inputs
      try {
        typeforce(cbType.arguments, req.body)
        validate(req.body, networkName)

      } catch (e) {
        return res.jsend.error(e.message)
      }

      callback(req.body, function (err, results) {
        if (err) return res.jsend.error(err.message)

        // enforce our own spec. compliance
        try {
          typeforce(cbType.expected, results)

        } catch (err) {
          return res.jsend.error(err.message)
        }

        return res.jsend.success(results)
      })
    })
  }

  endpoint('/addresses/summary', types.addresses.summary, function (body, callback) {
    api.addresses.summary(body.addresses, callback)
  })
  endpoint('/addresses/transactions', types.addresses.transactions, function (body, callback) {
    api.addresses.transactions(body.addresses, body.blockHeight || 0, callback)
  })
  endpoint('/addresses/unspents', types.addresses.unspents, function (body, callback) {
    api.address.unspents(body.addresses, callback)
  })
  endpoint('/blocks/get', types.blocks.get, function (body, callback) {
    api.blocks.get(body.blockIds, callback)
  })
  endpoint('/blocks/latest', types.blocks.latest, function (body, callback) {
    api.blocks.latest(callback)
  })
  endpoint('/blocks/propagate', types.blocks.propagate, function (body, callback) {
    api.blocks.propagate(body.blockHex, callback)
  })
  endpoint('/blocks/summary', types.blocks.summary, function (body, callback) {
    api.blocks.summary(body.blockIds, callback)
  })
  endpoint('/transactions/get', types.transactions.get, function (body, callback) {
    api.transactions.get(body.txIds, callback)
  })
  endpoint('/transactions/latest', types.transactions.latest, function (body, callback) {
    api.transactions.latest(callback)
  })
  endpoint('/transactions/propagate', types.transactions.propagate, function (body, callback) {
    async.mapSeries(body.txHexs, function (txHex, callback2) {
      api.transactions.propagate(txHex, callback2)
    }, callback)
  })
  endpoint('/transactions/summary', types.transactions.summary, function (body, callback) {
    api.transactionsSummary(body.txIds, callback)
  })

  return router
}

module.exports = createRouter
