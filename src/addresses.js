var bitcoinjs = require('bitcoinjs-lib')
var pg = require('pg')
var swig = require("swig")
var typeforce = require('typeforce')

var sql = {
  addressSummary: swig.compileFile('./src/sql/addressSummary.sql')
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
    console.log(this.network, this.networkStr)
    addresses.forEach(self.__validateAddress.bind(self))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var query = sql.addressSummary({ addresses: addresses })

  console.log(query)

  pg.connect(this.connString, function(err, client, free) {
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

//Addresses.prototype.transactions = function(req, res) {
//  var addresses = req.body.addresses
//  var blockHeight = req.body.blockHeight || 0
//
//  try {
//    typeforce(['String'], addresses)
//    addresses.forEach(validateAddress.bind(undefined, bc.network))
//
//    typeforce('Number', blockHeight)
//  } catch (e) {
//    return req.jsend.fail(e)
//  }
//
//  bc.addressTransactions(addresses, blockHeight, function(err, results) {
//    if (err) return res.jsend.error('Something went wrong')
//
//    return res.jsend.success(results)
//  })
//}
//
//  unspents: function(bc, req, res) {
//    var addresses = req.body.addresses
//
//    try {
//      typeforce(['String'], addresses)
//      addresses.forEach(validateAddress.bind(undefined, bc.network))
//
//    } catch (e) {
//      return req.jsend.fail(e)
//    }
//
//    bc.addressUnspents(addresses, function(err, results) {
//      if (err) return res.jsend.error('Something went wrong')
//
//      return res.jsend.success(results)
//    })
//  }
//}

module.exports = Addresses
