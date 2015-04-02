var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')

function batchRpc(rpc, command, params, callback) {
  var commands = params.map(function(param) {
    return {
      method: command,
      params: [param]
    }
  })

  var failed = false
  var results = []
  rpc.cmd(commands, function(err, result) {
    if (failed) return

    results.push(result)

    // short circuit error
    if (err) {
      failed = true
      return callback(err)
    }

    if (results.length < params.length) return
    return callback(null, results)
  })
}

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

function runQuery(connString, queryText, queryValues, callback) {
  pg.connect(connString, function(err, client, free) {
    if (err) return callback(err)

    client.query(queryText, queryValues, function(err, results) {
      free()

      return callback(err, results && results.rows)
    })
  })
}

function validateAddress(networkStr, addressStr) {
  var network = bitcoinjs.networks[networkStr]

  try {
    var address = bitcoinjs.Address.fromBase58Check(addressStr)

    if (address.version !== network.pubKeyHash &&
        address.version !== network.scriptHash) throw new Error('Bad network')
  } catch(e) {
    throw new Error(addressStr + ' is not a valid ' + networkStr + ' address')
  }
}

function validateBlockId(blockId) {
  if (blockId.length !== 64) throw new Error(blockId + ' is not a valid blockId')
}

function validateTransactionId(txId) {
  if (txId.length !== 64) throw new Error(txId + ' is not a valid txId')
}

module.exports = {
  batchRpc: batchRpc,
  bindArguments: bindArguments,
  runQuery: runQuery,
  validateAddress: validateAddress,
  validateBlockId: validateBlockId,
  validateTransactionId: validateTransactionId
}
