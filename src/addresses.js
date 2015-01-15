var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')
var swig = require("swig")
var typeforce = require('typeforce')

var sql = {
  summary: swig.compileFile('./src/sql/addressSummary.sql'),
  transactions: swig.compileFile('./src/sql/addressTransactions.sql'),
  unspents: swig.compileFile('./src/sql/addressUnspents.sql')
}

function Addresses(connString, networkStr) {
  this.connString = connString
  this.network = bitcoinjs.networks[networkStr]
  this.networkStr = networkStr
}

Addresses.prototype.__validateAddress = function(string) {
  try {
    var address = bitcoinjs.Address.fromBase58Check(string)

    if (address.version !== this.network.pubKeyHash &&
        address.version !== this.network.scriptHash) throw new Error('Bad network')
  } catch(e) {
    throw new Error(string + ' is not a valid ' + this.networkStr + ' address')
  }
}

Addresses.prototype.summary = function(req, res) {
  var addresses = req.body.addresses
  var self = this

  try {
    typeforce(['String'], addresses)
    addresses.forEach(self.__validateAddress.bind(self))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var query = sql.summary({ addresses: addresses })

  pg.connect(this.connString, function(err, client, free) {
    if (err) return res.jsend.error(err.message)

    client.query(query, function(err, results) {
      free()

      if (err) return res.jsend.error(err.message)

      return res.jsend.success(results.rows.map(function(row) {
        return {
          address: row.addr_bs58,
          balance: row.total_balance,
          totalReceived: row.total_received_amount,
          txCount: row.total_tx_count
        }
      }))
    })
  })
}

Addresses.prototype.transactions = function(req, res) {
  var addresses = req.body.addresses
  var blockHeight = req.body.blockHeight || 0
  var self = this

  try {
    typeforce(['String'], addresses)
    addresses.forEach(self.__validateAddress.bind(self))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var query = sql.transactions({ addresses: addresses, blockHeight: blockHeight })

  pg.connect(this.connString, function(err, client, free) {
    if (err) return res.jsend.error(err.message)

    client.query(query, function(err, results) {
      free()

      if (err) return res.jsend.error(err.message)

      return res.jsend.success(results.rows.map(function(row) {
        return {
          txId: row.txId,
          txHex: row.txHex,
          blockId: row.blockId,
          blockHeight: row.blockHeight
        }
      }))
    })
  })
}

Addresses.prototype.unspents = function(req, res) {
  var addresses = req.body.addresses
  var self = this

  try {
    typeforce(['String'], addresses)
    addresses.forEach(self.__validateAddress.bind(self))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var query = sql.unspents({ addresses: addresses })

  pg.connect(this.connString, function(err, client, free) {
    if (err) return res.jsend.error(err.message)

    client.query(query, function(err, results) {
      free()

      if (err) return res.jsend.error(err.message)

      return res.jsend.success(results.rows.map(function(row) {
        return {
          txId: row.tx_hash,
          confirmations: row.confirmations,
          address: row.addr_bs58,
          value: row.txout_value,
          vout: row.vout
        }
      }))
    })
  })
}

module.exports = Addresses
