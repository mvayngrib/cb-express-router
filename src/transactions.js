var async = require('async')
var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  get: swig.compileFile('./src/sql/transactions.sql'),
  getInputs: swig.compileFile('./src/sql/transactionInputs.sql'),
  getOutputs: swig.compileFile('./src/sql/transactionOutputs.sql')
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

      seen[detail.tx_hash] = detail
    })

    try {
      inputs.forEach(function(row) {
        var txId = row.tx_hash
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].inputs[row.txin_pos] = row
      })

      outputs.forEach(function(row) {
        var txId = row.tx_hash
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].outputs[row.txout_pos] = row
      })

      return res.jsend.success(txIds.map(function(txId) {
        if (!(txId in seen)) throw txId + ' not found'

        var detail = seen[txId]
        var txHex = utils.buildTransaction(detail).toHex()

        return {
          txId: txId,
          txHex: txHex,
          blockId: detail.block_hash,
          blockHeight: detail.block_height
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
}

Transactions.prototype.propagate = function(req, res) {
  var txHexs = req.body.txHexs

  try {
    typeforce(['String'], txHexs)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

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

      seen[detail.tx_hash] = detail
    })

    try {
      inputs.forEach(function(row) {
        var txId = row.tx_hash
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].inputs[row.txin_pos] = row
      })

      outputs.forEach(function(row) {
        var txId = row.tx_hash
        if (!(txId in seen)) throw txId + ' is weird'

        seen[txId].outputs[row.txout_pos] = row
      })

      return res.jsend.success(txIds.map(function(txId) {
        if (!(txId in seen)) throw txId + ' not found'

        var detail = seen[txId]
        var totalInputValue = detail.inputs.reduce(function(a, x) { return a + parseInt(x.prev_txout_value) }, 0)
        var totalOutputValue = detail.outputs.reduce(function(a, x) { return a + parseInt(x.txout_value) }, 0)

        return {
          txId: txId,
          blockId: detail.block_hash,
          blockHeight: detail.block_height,
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
