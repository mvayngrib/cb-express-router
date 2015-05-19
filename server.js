var cors = require('cors')
var divulge = require('divulge')
var express = require('express')
var fs = require('fs')
var http = require('http')
var https = require('https')
var morgan = require('morgan')
var swig = require('swig')
var timeago = require('timeago')

////////////////////////////////////////////////////////

var createRouter = require('./lib')
var config = divulge(process.env, {
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
})

////////////////////////////////////////////////////////

var appRouter = createRouter('/v1', config)
var app = express()

// reverse proxy in use
app.enable('trust proxy')

// disable X-Powered-By header
app.disable('x-powered-by')

// stdout logging
app.use(morgan('tiny'))

// allow cross origin requests
app.use(cors())

// our custom router
app.use(appRouter)

////////////////////////////////////////////////////////

var startTime = new Date()

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('views', __dirname + '/views')
app.get('/', function(req, res) {
  res.render('index', {
    displayName: config.displayName,
    started: timeago(+startTime),
    requests: appRouter.requestCount
  })
})

// otherwise serve statically
app.use(express.static(__dirname + '/public'))

////////////////////////////////////////////////////////

var server
if (config.https) {
  server = https.createServer({
    key: fs.readFileSync(config.https.key),
    cert: fs.readFileSync(config.https.cert)
  }, app)

} else {
  server = http.createServer(app)
}

server.listen(config.port)
