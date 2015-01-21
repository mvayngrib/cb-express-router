var async = require('async')
var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  get: swig.compileFile('./src/sql/transactions.sql'),
  getInputs: swig.compileFile('./src/sql/transactionIns.sql'),
  getOutputs: swig.compileFile('./src/sql/transactionOuts.sql')
}

function Transactions(connString) {
  this.connString = connString
}

//latest: function(req, res) {
//propagate: function(req, res) {
//summary: function(req, res) {

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
        if (!(txId in seen)) throw new Error(txId + ' is weird')

        seen[txId].inputs[row.txin_pos] = row
      })

      outputs.forEach(function(row) {
        var txId = row.tx_hash
        if (!(txId in seen)) throw new Error(txId + ' is weird')

        seen[txId].outputs[row.txout_pos] = row
      })

      return res.jsend.success(txIds.map(function(txId) {
        if (!(txId in seen)) throw new Error(txId + ' not found')

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
      return res.jsend.fail(e.message)
    }
  })
}

module.exports = Transactions
