var pg = require('pg')

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
  pg.connect(this.connString, function(err, client, free) {
    if (err) return callback(err)

    client.query(queryText, queryValues, function(err, results) {
      free()

      return callback(err, results)
    })
  })
}

module.exports = {
  bindArguments: bindArguments,
  runQuery: runQuery
}
