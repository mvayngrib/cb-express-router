var cors = require('cors')
var divulge = require('divulge')
var express = require('express')
var morgan = require('morgan')
var swig = require('swig')
var timeago = require('timeago')

var config = divulge({
  displayName: "",
  network: "bitcoin",
  port: 80,
  postgres: "",
  rpc: {
    host: "",
    port: 8332,
    user: "",
    pass: ""
  }
}, '', process.env)
var createRouter = require('./lib')

////////////////////////////////////////////////////////

var api = createRouter('/v1', config)
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

var startTime = new Date()

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('views', __dirname + '/views')
app.get('/', function(req, res) {
  res.render('index', {
    displayName: config.displayName,
    started: timeago(+startTime),
    requests: api.requestCount
  })
})

// otherwise serve statically
app.use(express.static(__dirname + '/public'))

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
