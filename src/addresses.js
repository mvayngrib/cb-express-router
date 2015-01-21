var async = require('async')
var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  summary: swig.compileFile('./src/sql/addressSummary.sql'),
  transactions: swig.compileFile('./src/sql/addressTransactions.sql'),
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

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.summary({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    var seen = {}
    results.forEach(function(row) {
      var result

      if (row.unconfirmed_balance === null) {
        result = {
          address: row.addr_bs58,
          balance: row.confirmed_balance,
          totalReceived: row.confirmed_received_amount,
          txCount: row.confirmed_received_tx_count
        }

      } else {
        result = {
          address: row.addr_bs58,
          balance: row.confirmed_balance + row.unconfirmed_balance,
          totalReceived: row.confirmed_received_amount + row.unconfirmed_received_amount,
          txCount: row.confirmed_received_tx_count + row.unconfirmed_received_tx_count
        }
      }

      seen[row.addr_bs58] = result
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

Addresses.prototype.unspents = function(req, res) {
  var addresses = req.body.addresses

  try {
    typeforce(['String'], addresses)
    addresses.forEach(utils.validateAddress.bind(null, this.networkStr))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var bindArgs = utils.bindArguments(addresses.length)
  var query = sql.unspents({ addresses: bindArgs })

  utils.runQuery(this.connString, query, addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results.map(function(row) {
      return {
        txId: row.tx_hash,
        confirmations: row.confirmations,
        address: row.addr_bs58,
        value: row.txout_value,
        vout: row.txout_pos
      }
    }))
  })
}

module.exports = Addresses
