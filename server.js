var config = require('./config')
var cors = require('cors')
var express = require('express')
var morgan = require('morgan')

var createApp = require('./src')

////////////////////////////////////////////////////////

var api = createApp(config)
var app = express()

// reverse proxy in use
app.enable('trust proxy')

// disable X-Powered-By header
app.disable('x-powered-by')

// stdout logging
app.use(morgan('tiny'))

// allow cross origin requests
app.use(cors())

// our custom api
app.use(api)

////////////////////////////////////////////////////////

var server
if (config.https) {
  var fs = require('fs')
  var https = require('https')

  server = https.createServer({
    key: fs.readFileSync(config.https.key),
    cert: fs.readFileSync(config.https.cert)
  }, app)

} else {
  var http = require('http')

  server = http.createServer(app)
}

server.listen(config.port)
