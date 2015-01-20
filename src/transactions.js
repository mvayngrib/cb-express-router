var async = require('async')
var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')
var swig = require("swig")
var typeforce = require('typeforce')

var sql = {
  getInfo: swig.compileFile('./src/sql/transactionInfo.sql'),
  getInputs: swig.compileFile('./src/sql/transactionIns.sql'),
  getOutputs: swig.compileFile('./src/sql/transactionOuts.sql')
}

function Transactions(connString, networkStr) {
  this.connString = connString
  this.network = bitcoinjs.networks[networkStr]
  this.networkStr = networkStr
}

Transactions.prototype.__validateTxId = function(string) {
  if (string.length !== 64) throw new Error(string + ' is not a valid txId')
}

//latest: function(req, res) {
//propagate: function(req, res) {
//summary: function(req, res) {

Transactions.prototype.get = function(req, res) {
  var txIds = req.body.txIds
  var self = this

  try {
    typeforce(['String'], txIds)
    txIds.forEach(self.__validateTxId.bind(self))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var queryInfo = sql.getInfo({ txIds: txIds })
  var queryInputs = sql.getInputs({ txIds: txIds })
  var queryOutputs = sql.getOutputs({ txIds: txIds })

  pg.connect(this.connString, function(err, client, free) {
    if (err) return res.jsend.error(err.message)

    async.parallel([
      client.query.bind(client, queryInfo),
      client.query.bind(client, queryInputs),
      client.query.bind(client, queryOutputs)
    ], function(err, results) {
      free()

      if (err) return res.jsend.error(err.message)

      var info = results[0].rows
      var inputs = results[1].rows
      var outputs = results[2].rows

      var seen = {}
      info.forEach(function(row) {
        var detail = row
        detail.inputs = []
        detail.outputs = []

        seen[row.tx_hash] = detail
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
          var tx = new bitcoinjs.Transaction()

          tx.locktime = parseInt(detail.tx_locktime)
          tx.version = parseInt(detail.tx_version)

          detail.inputs.forEach(function(txIn) {
            var index = parseInt(txIn.prev_txout_pos)
            var script = bitcoinjs.Script.fromHex(txIn.txin_scriptsig)
            var sequence = parseInt(txIn.txin_sequence)
            var txId = txIn.prev_tx_hash

            tx.addInput(txId, index, sequence, script)
          })

          detail.outputs.forEach(function(txOut) {
            var script = bitcoinjs.Script.fromHex(txOut.txout_scriptpubkey)
            tx.addOutput(script, parseInt(txOut.txout_value))
          })

          return {
            txId: txId,
            txHex: tx.toHex(),
            blockId: detail.block_hash,
            blockHeight: detail.block_height
          }
        }))

      } catch (err) {
        return res.jsend.fail(err.message)
      }
    })
  })
}

module.exports = Transactions
