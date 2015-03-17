var typeforce = require('typeforce')
var utils = require('./utils')

function Blocks(database, rpc) {
  this.db = database
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

  this.db.blocksGet(blockIds, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

Blocks.prototype.latest = function(req, res) {
  this.db.blocksLatest(function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
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

  utils.batchRpc(this.rpc, 'submitblock', blockHexs, function(err, results) {
    if (err) return res.jsend.fail(err.message)

    return res.jsend.success(results)
  })
}

Blocks.prototype.summary = function(req, res) {
  var blockIds = req.body.blockIds

  try {
    typeforce(['String'], blockIds)
    blockIds.forEach(utils.validateBlockId)

  } catch (e) {
    return res.jsend.fail(e.message)
  }

  this.db.blocksSummary(blocksIds, function(err, results) {
    if (err) return res.jsend.error(err.message)

    return res.jsend.success(results)
  })
}

module.exports = Blocks
