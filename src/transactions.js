var typeforce = require('typeforce')
var utils = require('./utils')

function Transactions(database, rpc) {
  this.db = database
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

  this.db.transactionsGet(txIds, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

Transactions.prototype.latest = function(req, res) {
  this.db.transactionsLatest(function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
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

  this.db.transactionsSummary(function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

module.exports = Transactions
