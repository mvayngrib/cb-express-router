var async = require('async')
var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  summary: swig.compileFile('./src/sql/addressSummary.sql'),
  transactions: swig.compileFile('./src/sql/addressTransactions.sql'),
  transactionInputs: swig.compileFile('./src/sql/transactionInputs.sql'),
  transactionOutputs: swig.compileFile('./src/sql/transactionOutputs.sql'),
  unspents: swig.compileFile('./src/sql/addressUnspents.sql')
}

function Addresses(connString, networkStr) {
  this.connString = connString
  this.networkStr = networkStr
}

Addresses.prototype.summary = function(req, res) {
  var addresses = req.body.addresses

  try {
    typeforce(['String'], addresses)
    addresses.forEach(utils.validateAddress.bind(null, this.networkStr))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (addresses.length === 0) return res.jsend.success([])

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.summary({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    var seen = {}
    results.forEach(function(row) {
      row.balance = parseInt(row.balance)
      row.totalReceived = parseInt(row.totalReceived)
      row.txCount = parseInt(row.txCount)

      seen[row.address] = row
    })

    return res.jsend.success(addresses.map(function(address) {
      return seen[address] || {
        address: address,
        balance: 0,
        totalReceived: 0,
        txCount: 0
      }
    }))
  })
}

Addresses.prototype.transactions = function(req, res) {
  var addresses = req.body.addresses
  var blockHeight = req.body.blockHeight || 0

  try {
    typeforce(['String'], addresses)
    typeforce('Number', blockHeight)
    addresses.forEach(utils.validateAddress.bind(null, this.networkStr))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (addresses.length === 0) return res.jsend.success([])

  var connString = this.connString
  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.transactions({ addresses: bindArgs })

  utils.runQuery(connString, query, addresses, function(err, details) {
    if (err) return res.jsend.error(err.message)

    var seen = {}
    details.forEach(function(detail) {
      detail.blockHeight = parseInt(detail.blockHeight)
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

    var txIds = Object.keys(seen)
    if (txIds.length === 0) return res.jsend.success([])

    var bindArgs2 = utils.bindArguments(txIds.length)
    var queryInputs = sql.transactionInputs({ txIds: bindArgs2 })
    var queryOutputs = sql.transactionOutputs({ txIds: bindArgs2 })

    async.parallel([
      utils.runQuery.bind(null, connString, queryInputs, txIds),
      utils.runQuery.bind(null, connString, queryOutputs, txIds)
    ], function(err, results) {
      if (err) return res.jsend.error(err.message)

      var inputs = results[0]
      var outputs = results[1]

      try {
        inputs.forEach(function(row) {
          var txId = row.txId
          if (!(txId in seen)) throw txId + ' is weird'

          row.value = parseInt(row.value)
          row.vout = parseInt(row.vout)
          row.sequence = parseInt(row.sequence)

          seen[txId].inputs[row.n] = row
        })

        outputs.forEach(function(row) {
          var txId = row.txId
          if (!(txId in seen)) throw txId + ' is weird'

          row.value = parseInt(row.value)

          seen[txId].outputs[row.n] = row
        })

        return res.jsend.success(txIds.map(function(txId) {
          if (!(txId in seen)) throw txId + ' not found'

          var detail = seen[txId]
          var txHex = utils.buildTransaction(detail).toHex()

          return {
            txId: txId,
            txHex: txHex,
            blockId: detail.blockId,
            blockHeight: detail.blockHeight
          }
        }))

      } catch (e) {
        if (typeof e !== 'string') throw e

        return res.jsend.fail(e)
      }
    })
  })
}

Addresses.prototype.unspents = function(req, res) {
  var addresses = req.body.addresses

  try {
    typeforce(['String'], addresses)
    addresses.forEach(utils.validateAddress.bind(null, this.networkStr))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (addresses.length === 0) return res.jsend.success([])

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.unspents({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results.map(function(result) {
      result.confirmations = parseInt(result.confirmations)
      result.value = parseInt(result.value)
      result.vout = parseInt(result.vout)

      return result
    }))
  })
}

module.exports = Addresses
