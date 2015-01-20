var async = require('async')
var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')
var swig = require("swig")
var typeforce = require('typeforce')

var sql = {
  get: swig.compileFile('./src/sql/transactions.sql'),
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

  pg.connect(this.connString, function(err, client, free) {
    if (err) return res.jsend.error(err.message)

    async.map(txIds, function(txId, callback) {
      var queryInfo = sql.getInfo({ txId: txId })
      var queryInputs = sql.getInputs({ txId: txId })
      var queryOutputs = sql.getOutputs({ txId: txId })

      async.parallel([
        client.query.bind(client, queryInfo),
        client.query.bind(client, queryInputs),
        client.query.bind(client, queryOutputs)
      ], function(err, results) {
        if (err) return callback(err)

        var info = results[0].rows[0]
        var inputs = results[1].rows
        var outputs = results[2].rows

        if (!info) return callback(new Error(txId + ' not found'))

        var tx = new bitcoinjs.Transaction()

        tx.locktime = parseInt(info.tx_locktime)
        tx.version = parseInt(info.tx_version)

        inputs.forEach(function(txIn) {
          var index = parseInt(txIn.prev_txout_pos)
          var script = bitcoinjs.Script.fromHex(txIn.txin_scriptsig)
          var sequence = parseInt(txIn.txin_sequence)
          var txId = txIn.prev_tx_hash

          tx.addInput(txId, index, sequence, script)
        })

        outputs.forEach(function(txOut) {
          var script = bitcoinjs.Script.fromHex(txOut.txout_scriptpubkey)
          tx.addOutput(script, parseInt(txOut.txout_value))
        })

        return callback(undefined, {
          txId: txId,
          txHex: tx.toHex(),
          blockId: info.block_hash,
          blockHeight: info.block_height
        })
      })
    }, function(err, results) {
      free()

      if (err) return res.jsend.fail(err.message)

      return res.jsend.success(results)
    })
  })
}

module.exports = Transactions
