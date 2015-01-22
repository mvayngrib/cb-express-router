var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  get: swig.compileFile('./src/sql/blocks.sql'),
  latest: swig.compileFile('./src/sql/blocksLatest.sql')
}

function Blocks(connString, rpc) {
  this.connString = connString
  this.rpc = rpc
}

Blocks.prototype.get = function(req, res) {
  var blockIds = req.body.blockIds

  try {
    typeforce(['String'], blockIds)
    blockIds.forEach(utils.validateBlockId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (blockIds.length === 0) return res.jsend.success([])

  return res.jsend.fail('TODO')
}

Blocks.prototype.latest = function(req, res) {
  var query = sql.latest({ limit: 1 })

  utils.runQuery(this.connString, query, [], function(err, results) {
    if (err) return res.jsend.error(err.message)

    var latest = results.pop()
    latest.nonce = parseInt(latest.nonce)
    latest.version = parseInt(latest.version)
    latest.blockHeight = parseInt(latest.blockHeight)
    latest.blockSize = parseInt(latest.blockSize)
    latest.timestamp = parseInt(latest.timestamp)
    latest.txCount = parseInt(latest.txCount)

    return res.jsend.success(latest)
  })
}

Blocks.prototype.propagate = function(req, res) {
  var blockHexs = req.body.blockHexs

  try {
    typeforce(['String'], blockHexs)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (blockHexs.length === 0) return res.jsend.success([])

  return res.jsend.fail('TODO')
}

Blocks.prototype.summary = function(req, res) {
  var blockIds = req.body.blockIds

  try {
    typeforce(['String'], blockIds)
    blockIds.forEach(utils.validateBlockId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  if (blockIds.length === 0) return res.jsend.success([])

  var bindArgs = utils.bindArguments(blockIds.length)
  var query = sql.get({ blockIds: bindArgs })

  utils.runQuery(this.connString, query, blockIds, function(err, results) {
    if (err) return res.jsend.error(err.message)

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
      return res.jsend.success(blockIds.map(function(blockId) {
        if (!(blockId in seen)) throw blockId + ' not found'

        return seen[blockId]
      }))
    } catch (e) {
      if (typeof e !== 'string') throw e

      return res.jsend.fail(e)
    }
  })
}

module.exports = Blocks
