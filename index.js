var bodyParser = require('body-parser')
var express = require('express')
var typeforce = require('typeforce')
var types = require('./types')

function createRouter (api) {
  var router = new express.Router()

  // parse application/json
  router.use(bodyParser.json())

  // POST route helper function
  function endpoint (route, type, callback) {
    var cArgType = typeforce.compile(type.arguments)
    var cExpType = typeforce.compile(type.expected)

    router.post(route, function (req, res) {
      // validate the inputs
      try {
        typeforce(cArgType, req.body, true)
      } catch (e) {
        return res.status(400).send(e.message)
      }

      callback(req.body, function (err, results) {
        if (err) return res.status(500).send(err.message)

        // enforce our own spec. compliance
        try {
          typeforce(cExpType, results, true)
        } catch (e) {
          return res.status(500).send(e.message)
        }

        res.status(200).json(results)
      })
    })
  }

  endpoint('/addresses/summary', types.addresses.summary, function (body, callback) {
    if (body.addresses.length === 0) return callback(null, [])

    api.addresses.summary(body.addresses, callback)
  })
  endpoint('/addresses/transactions', types.addresses.transactions, function (body, callback) {
    if (body.addresses.length === 0) return callback(null, [])

    api.addresses.transactions(body.addresses, body.blockHeight || 0, callback)
  })
  endpoint('/addresses/unspents', types.addresses.unspents, function (body, callback) {
    if (body.addresses.length === 0) return callback(null, [])

    api.addresses.unspents(body.addresses, callback)
  })
  endpoint('/blocks/get', types.blocks.get, function (body, callback) {
    if (body.blockIds.length === 0) return callback(null, [])

    api.blocks.get(body.blockIds, callback)
  })
  endpoint('/blocks/latest', types.blocks.latest, function (body, callback) {
    api.blocks.latest(callback)
  })
  endpoint('/blocks/propagate', types.blocks.propagate, function (body, callback) {
    api.blocks.propagate(body.blockHex, callback)
  })
  endpoint('/blocks/summary', types.blocks.summary, function (body, callback) {
    if (body.blockIds.length === 0) return callback(null, [])

    api.blocks.summary(body.blockIds, callback)
  })
  endpoint('/transactions/get', types.transactions.get, function (body, callback) {
    if (body.txIds.length === 0) return callback(null, [])

    api.transactions.get(body.txIds, callback)
  })
  endpoint('/transactions/latest', types.transactions.latest, function (body, callback) {
    api.transactions.latest(callback)
  })
  endpoint('/transactions/propagate', types.transactions.propagate, function (body, callback) {
    if (body.txHexs.length === 0) return callback(null, [])

    api.transactions.propagate(body.txHexs, callback)
  })
  endpoint('/transactions/summary', types.transactions.summary, function (body, callback) {
    if (body.txIds.length === 0) return callback(null, [])

    api.transactions.summary(body.txIds, callback)
  })

  return router
}

module.exports = createRouter
