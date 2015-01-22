var async = require('async')
var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  get: swig.compileFile('./src/sql/transactions.sql'),
  getInputs: swig.compileFile('./src/sql/transactionInputs.sql'),
  getOutputs: swig.compileFile('./src/sql/transactionOutputs.sql'),
//  latest: swig.compileFile('./src/sql/transactionsLatest.sql')
}

function Transactions(connString, rpc) {
  this.connString = connString
  this.rpc = rpc
}

Transactions.prototype.get = function(req, res) {
  var txIds = req.body.txIds

  try {
    typeforce(['String'], txIds)
    txIds.forEach(utils.validateTransactionId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (txIds.length === 0) return res.jsend.success([])

  var bindArgs = utils.bindArguments(txIds.length)
  var query = sql.get({ txIds: bindArgs })
  var queryInputs = sql.getInputs({ txIds: bindArgs })
  var queryOutputs = sql.getOutputs({ txIds: bindArgs })

  async.parallel([
    utils.runQuery.bind(null, this.connString, query, txIds),
    utils.runQuery.bind(null, this.connString, queryInputs, txIds),
    utils.runQuery.bind(null, this.connString, queryOutputs, txIds)
  ], function(err, results) {
    if (err) return res.jsend.error(err.message)

    var details = results[0]
    var inputs = results[1]
    var outputs = results[2]

    var seen = {}
    details.forEach(function(detail) {
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

    try {
      inputs.forEach(function(row) {
        var txId = row.txId
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].inputs[row.n] = row
      })

      outputs.forEach(function(row) {
        var txId = row.txId
        if (!(txId in seen)) throw txId + ' is weird'

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
}

Transactions.prototype.latest = function(req, res) {
  return res.jsend.fail('TODO')

//  var query = sql.latest({ limit: 1 })
//
//  utils.runQuery(this.connString, query, [], function(err, results) {
//    if (err) return res.jsend.error(err.message)
//
//    var latest = results.pop()
//    return res.jsend.success(latest)
//  })
}

Transactions.prototype.propagate = function(req, res) {
  var txHexs = req.body.txHexs

  try {
    typeforce(['String'], txHexs)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (txHexs.length === 0) return res.jsend.success([])

  utils.batchRpc(this.rpc, 'sendrawtransaction', txHexs, function(err, results) {
    if (err) return res.jsend.fail(err.message)

    return res.jsend.success(results)
  })
}

Transactions.prototype.summary = function(req, res) {
  var txIds = req.body.txIds

  try {
    typeforce(['String'], txIds)
    txIds.forEach(utils.validateTransactionId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (txIds.length === 0) return res.jsend.success([])

  var bindArgs = utils.bindArguments(txIds.length)
  var query = sql.get({ txIds: bindArgs })
  var queryInputs = sql.getInputs({ txIds: bindArgs })
  var queryOutputs = sql.getOutputs({ txIds: bindArgs })

  async.parallel([
    utils.runQuery.bind(null, this.connString, query, txIds),
    utils.runQuery.bind(null, this.connString, queryInputs, txIds),
    utils.runQuery.bind(null, this.connString, queryOutputs, txIds)
  ], function(err, results) {
    if (err) return res.jsend.error(err.message)

    var details = results[0]
    var inputs = results[1]
    var outputs = results[2]

    var seen = {}
    details.forEach(function(detail) {
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

    try {
      inputs.forEach(function(row) {
        var txId = row.txId
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].inputs[row.n] = row
      })

      outputs.forEach(function(row) {
        var txId = row.txId
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].outputs[row.n] = row
      })

      return res.jsend.success(txIds.map(function(txId) {
        if (!(txId in seen)) throw txId + ' not found'

        var detail = seen[txId]
        var totalInputValue = detail.inputs.reduce(function(a, x) { return a + parseInt(x.value) }, 0)
        var totalOutputValue = detail.outputs.reduce(function(a, x) { return a + parseInt(x.value) }, 0)

        return {
          txId: txId,
          blockId: detail.blockId,
          blockHeight: detail.blockHeight,
          nInputs: detail.inputs.length,
          nOutputs: detail.outputs.length,
          totalInputValue: totalInputValue,
          totalOutputValue: totalOutputValue
        }
      }))
    } catch (e) {
      if (typeof e !== 'string') throw e

      return res.jsend.fail(e)
    }
  })
}

module.exports = Transactions
