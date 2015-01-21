var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')

var __bindCache = {}
function bindArguments(n) {
  if (n in __bindCache) return __bindCache[n]

  var args = []
  for (var i = 1; i <= n; ++i) {
    args.push('$' + i)
  }

  __bindCache[n] = args
  return args
}

function buildTransaction(detail) {
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

  return tx
}

function runQuery(connString, queryText, queryValues, callback) {
  pg.connect(connString, function(err, client, free) {
    if (err) return callback(err)

    client.query(queryText, queryValues, function(err, results) {
      free()

      return callback(err, results && results.rows)
    })
  })
}

module.exports = {
  bindArguments: bindArguments,
  buildTransaction: buildTransaction,
  runQuery: runQuery
}