var divulge = require('divulge')
var config = divulge({
  displayName: "",
  network: "",
  port: 80,
  postgres: "",
  rpc: {
    host: "",
    port: 18332,
    user: "",
    pass: ""
  }
}, '', process.env)
var cors = require('cors')
var express = require('express')
var morgan = require('morgan')
var swig = require('swig')

var createRouter = require('./lib')

////////////////////////////////////////////////////////

var api = createRouter(config)
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

function timeSince(date) {
  var str = ""
  var seconds = Math.floor((new Date() - date) / 1000)

  var years = Math.floor(seconds / 31536000)
  if (years) str += years + " Years "

  var months = Math.floor(seconds / 2592000) % 12
  if (months) str += months + " Months "

  var days = Math.floor(seconds / 86400) % 365
  if (days) str += days + " Days "

  var hours = Math.floor(seconds / 3600) % 24
  if (hours) str += hours + " Hours "

  var minutes = Math.floor(seconds / 60) % 60
  if (minutes) str += minutes + " Minutes "

  seconds = seconds % 60
  if (seconds) str += seconds + " Seconds"

  return str
}

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('views', __dirname + '/views')
app.get('/', function(req, res) {
  res.render('index', {
    displayName: config.displayName,
    uptime: timeSince(startTime),
    requests: api.requestCount
  })
})

// otherwise serve statically
app.use(express.static(__dirname + '/public'));

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
