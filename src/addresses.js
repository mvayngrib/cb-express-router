var typeforce = require('typeforce')
var utils = require('./utils')

function Addresses(database, networkStr) {
  this.db = database
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

  this.db.addressSummary(addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

Addresses.prototype.transactions = function(req, res) {
  var addresses = req.body.addresses
  var blockHeight = req.body.blockHeight || 0

  try {
    typeforce(['String'], addresses)
    typeforce('Number', blockHeight)
    addresses.forEach(utils.validateAddress.bind(null, this.networkStr))

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  this.db.addressTransactions(addresses, blockHeight, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
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

  this.db.addressUnspents(addresses, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

module.exports = Addresses
