var typeforce = require('typeforce')

module.exports = {
  get: function(req, res) {
    var blockIds = req.body.blockIds

    try {
      typeforce(['String'], blockIds)
    } catch (e) {
      return req.jsend.fail(e)
    }

    return res.jsend.success()
  },

  latest: function(req, res) {
    return res.jsend.success()
  },

  propagate: function(req, res) {
    var blockHexs = req.body.blockHexs

    try {
      typeforce(['String'], blockHexs)
    } catch (e) {
      return req.jsend.fail(e)
    }

    return res.jsend.success()
  },

  summary: function(req, res) {
    var blockIds = req.body.blockIds

    try {
      typeforce(['String'], blockIds)
    } catch (e) {
      return req.jsend.fail(e)
    }

    return res.jsend.success()
  }
}
