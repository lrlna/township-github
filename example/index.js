var explain = require('explain-error')
var concat = require('concat-stream')
var Auth = require('township-auth')
var bankai = require('bankai')
var merry = require('merry')
var level = require('level')
var path = require('path')

var Github = require('../')

var env = merry.env({
  'DATABASE_PATH': '/tmp/users.db',
  'GITHUB_SECRET': String,
  'GITHUB_NAME': String,
  'GITHUB_ID': String,
  'PORT': 8080
})

var assets = bankai(path.join(__dirname, 'client.js'), { css: false })
var db = level(env.DATABASE_PATH)
var github = Github(env)
var app = merry()

var auth = Auth(db, {
  providers: { github: github.provider }
})

app.router([
  [ '/', _merryAssets(assets.html.bind(assets)) ],
  [ '/done.html', _merryAssets(assets.html.bind(assets)) ],
  [ '/bundle.js', _merryAssets(assets.js.bind(assets)) ],
  [ '/404', merry.notFound() ],
  [ '/redirect', redirect ],
  [ '/register', {
    'post': register
  } ],
  [ '/login', login ]
])
app.listen(env.PORT)

function redirect (req, res, ctx, next) {
  github.redirect(req, res)
  next(null, '')
}

function register (req, res, ctx, done) {
  _parseJson(req, function (err, json) {
    if (err) return done(err)
    var opts = {
      github: { code: json.code }
    }
    auth.create(opts, done)
  })
}

function login (req, res, ctx, done) {
  _parseJson(req, function (err, json) {
    if (err) return done(err)
    var opts = {
      github: { code: json.code }
    }
    auth.verify(opts, done)
  })
}

function _merryAssets (asset) {
  return function (req, res, ctx, done) {
    done(null, asset(req, res))
  }
}

function _parseJson (req, cb) {
  req.pipe(concat(function (buf) {
    try {
      var json = JSON.parse(buf)
    } catch (err) {
      return cb(explain(err, 'error parsing JSON'))
    }
    cb(null, json)
  }))
}

