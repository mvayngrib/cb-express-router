var swig = require("swig")
var typeforce = require('typeforce')
var utils = require('./utils')

var sql = {
  get: swig.compileFile('./src/sql/blocks.sql')
}

function Blocks(connString, rpc) {
  this.connString = connString
  this.rpc = rpc
}

Blocks.prototype.get = function(req, res) {
  return res.jsend.fail('TODO')
}

Blocks.prototype.latest = function(req, res) {
  return res.jsend.fail('TODO')
}

Blocks.prototype.propagate = function(req, res) {
  return res.jsend.fail('TODO')
}

Blocks.prototype.summary = function(req, res) {
  var blockIds = req.body.blockIds

  try {
    typeforce(['String'], blockIds)
    blockIds.forEach(utils.validateblockId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  var bindArgs = utils.bindArguments(blockIds.length)
  var query = sql.get({ blockIds: bindArgs })

  utils.runQuery(this.connString, query, blockIds, function(err, results) {
    if (err) return res.jsend.error(err.message)

    var seen = {}
    results.forEach(function(result) {
      seen[result.tx_hash] = result
    })

    try {
      return res.jsend.success(blockIds.map(function(blockId) {
        if (!(blockId in seen)) throw blockId + ' not found'

        var detail = seen[blockId]

        return {
          blockId: blockId,
          prevBlockId: detail.prev_block_hash,
          merkleRootHash: detail.block_hashmerkleroot,
          nonce: detail.block_nonce,
          version: detail.block_version,
          blockHeight: detail.block_height,
          blockSize: detail.block_bits,
          timestamp: detail.block_timestamp,
          txCount: detail.block_tx_count
        }
      }))
    } catch (e) {
      if (typeof e !== 'string') throw e

      return res.jsend.fail(e)
    }
  })
}

module.exports = Blocks
