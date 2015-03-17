var async = require('async')
var swig = require("swig")
var utils = require('./utils')

var sql = {
  addressSummary: swig.compileFile('./src/sql/addressSummary.sql'),
  addressTransactions: swig.compileFile('./src/sql/addressTransactions.sql'),
  addressUnspents: swig.compileFile('./src/sql/addressUnspents.sql'),
  blocks: swig.compileFile('./src/sql/blocks.sql'),
  blocksLatest: swig.compileFile('./src/sql/blocksLatest.sql'),
  transactionInputs: swig.compileFile('./src/sql/transactionInputs.sql'),
  transactionOutputs: swig.compileFile('./src/sql/transactionOutputs.sql'),
  transactions: swig.compileFile('./src/sql/transactions.sql'),
  transactionsLatest: swig.compileFile('./src/sql/transactionsLatest.sql')
}

function Database(connString) {
  this.connString = connString
}

Database.prototype.addressSummary = function(addresses, callback) {
  if (addresses.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.addressSummary({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return callback(err)

    var seen = {}
    results.forEach(function(row) {
      row.balance = parseInt(row.balance)
      row.totalReceived = parseInt(row.totalReceived)
      row.txCount = parseInt(row.txCount)

      seen[row.address] = row
    })

    callback(null, addresses.map(function(address) {
      return seen[address] || {
        address: address,
        balance: 0,
        totalReceived: 0,
        txCount: 0
      }
    }))
  })
}

Database.prototype.addressTransactions = function(addresses, blockHeight, callback) {
  if (addresses.length === 0) return callback(null, [])

  var connString = this.connString
  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.addressTransactions({ addresses: bindArgs })
  var self = this

  utils.runQuery(connString, query, addresses, function(err, details) {
    if (err) return callback(err)

    var seen = {}
    details.forEach(function(detail) {
      detail.blockHeight = parseInt(detail.blockHeight)
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

    var txIds = Object.keys(seen)
    self.transactionsGet(txIds, callback)
  })
}

Database.prototype.addressUnspents = function(addresses, callback) {
  if (addresses.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.addressUnspents({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return callback(err)

    callback(null, results.map(function(result) {
      result.confirmations = parseInt(result.confirmations)
      result.value = parseInt(result.value)
      result.vout = parseInt(result.vout)

      return result
    }))
  })
}

Database.prototype.blocksGet = function(blockIds, callback) {
  if (blockIds.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(blockIds.length)
  var query = sql.blocks({ blockIds: bindArgs })

  utils.runQuery(this.connString, query, blockIds, function(err, results) {
    if (err) return callback(err)

    var seen = {}
    results.forEach(function(result) {
      result.nonce = parseInt(result.nonce)
      result.version = parseInt(result.version)
      result.blockHeight = parseInt(result.blockHeight)
      result.blockSize = parseInt(result.blockSize)
      result.timestamp = parseInt(result.timestamp)
      result.txCount = parseInt(result.txCount)

      seen[result.blockId] = result
    })

    try {
      callback(null, blockIds.map(function(blockId) {
        if (!(blockId in seen)) throw blockId + ' not found'

        var detail = seen[blockId]
        var blockHex = utils.buildBlock(detail).toHex()

        return {
          blockId: blockId,
          blockHex: blockHex
        }
      }))
    } catch (e) {
      if (typeof e !== 'string') throw e

      callback(e)
    }
  })
}

Database.prototype.blocksLatest = function(callback) {
  var query = sql.blocksLatest({ limit: 1 })

  utils.runQuery(this.connString, query, [], function(err, results) {
    if (err) return callback(err)

    var latest = results.pop()
    latest.nonce = parseInt(latest.nonce)
    latest.version = parseInt(latest.version)
    latest.blockHeight = parseInt(latest.blockHeight)
    latest.blockSize = parseInt(latest.blockSize)
    latest.timestamp = parseInt(latest.timestamp)
    latest.txCount = parseInt(latest.txCount)

    callback(null, latest)
  })
}

Database.prototype.blocksSummary = function(blockIds, callback) {
  if (blockIds.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(blockIds.length)
  var query = sql.blocks({ blockIds: bindArgs })

  utils.runQuery(this.connString, query, blockIds, function(err, results) {
    if (err) return callback(err)

    var seen = {}
    results.forEach(function(result) {
      result.nonce = parseInt(result.nonce)
      result.version = parseInt(result.version)
      result.blockHeight = parseInt(result.blockHeight)
      result.blockSize = parseInt(result.blockSize)
      result.timestamp = parseInt(result.timestamp)
      result.txCount = parseInt(result.txCount)

      seen[result.blockId] = result
    })

    try {
      callback(null, blockIds.map(function(blockId) {
        if (!(blockId in seen)) throw blockId + ' not found'

        return seen[blockId]
      }))
    } catch (e) {
      if (typeof e !== 'string') throw e

      callback(e)
    }
  })
}


Database.prototype.transactionsGet = function(txIds, callback) {
  if (txIds.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(txIds.length)
  var query = sql.transactions({ txIds: bindArgs })
  var queryInputs = sql.transactionInputs({ txIds: bindArgs })
  var queryOutputs = sql.transactionOutputs({ txIds: bindArgs })

  async.parallel([
    utils.runQuery.bind(null, this.connString, query, txIds),
    utils.runQuery.bind(null, this.connString, queryInputs, txIds),
    utils.runQuery.bind(null, this.connString, queryOutputs, txIds)
  ], function(err, results) {
    if (err) return callback(err)

    var details = results[0]
    var inputs = results[1]
    var outputs = results[2]

    var seen = {}
    details.forEach(function(detail) {
      detail.blockHeight = parseInt(detail.blockHeight)
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

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

      callback(null, txIds.map(function(txId) {
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

      callback(e)
    }
  })
}

Database.prototype.transactionsLatest = function(callback) {
  var query = sql.transactionsLatest()
  var self = this

  utils.runQuery(this.connString, query, [], function(err, details) {
    if (err) return callback(err)

    var txIds = details.map(function(detail) { return detail.txId })
    self.transactionsGet(txIds, callback)
  })
}

Database.prototype.transactionsSummary = function(txIds, callback) {
  if (txIds.length === 0) return callback(null, [])

  var bindArgs = utils.bindArguments(txIds.length)
  var query = sql.transactions({ txIds: bindArgs })
  var queryInputs = sql.transactionInputs({ txIds: bindArgs })
  var queryOutputs = sql.transactionOutputs({ txIds: bindArgs })

  async.parallel([
    utils.runQuery.bind(null, this.connString, query, txIds),
    utils.runQuery.bind(null, this.connString, queryInputs, txIds),
    utils.runQuery.bind(null, this.connString, queryOutputs, txIds)
  ], function(err, results) {
    if (err) return callback(err)

    var details = results[0]
    var inputs = results[1]
    var outputs = results[2]

    var seen = {}
    details.forEach(function(detail) {
      detail.blockHeight = parseInt(detail.blockHeight)
      detail.inputs = []
      detail.outputs = []

      seen[detail.txId] = detail
    })

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

      callback(null, txIds.map(function(txId) {
        if (!(txId in seen)) throw txId + ' not found'

        var detail = seen[txId]
        var totalInputValue = detail.inputs.reduce(function(a, x) { return a + x.value }, 0)
        var totalOutputValue = detail.outputs.reduce(function(a, x) { return a + x.value }, 0)

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

      callback(e)
    }
  })
}

module.exports = Database
