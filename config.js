// defaults any config variable to their equivalent
// in no-space uppercase in process.env
function defaultToEnvironment(obj, prefix) {
  for (var key in obj) {
    var envKey = prefix + key.toUpperCase()
    var value = obj[key]

    if (typeof value !== 'object') {
      obj[key] = process.env[envKey] || value

    } else {
      defaultToEnvironment(value, envKey)
    }
  }

  return obj
}

var config = {
  "network": "",
  "port": 80,
  "postgres": "",
  "rpc": {
    "host": "",
    "port": 18332,
    "user": "",
    "pass": ""
  }
}

module.exports = defaultToEnvironment(config, '')
