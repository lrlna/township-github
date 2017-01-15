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

var mw = merry.middleware

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
    'post': mw([parseJson, register])
  } ],
  [ '/login', {
    'post': mw([parseJson, login])
  } ]
])
app.listen(env.PORT)

function redirect (req, res, ctx, next) {
  github.redirect(req, res)
  next(null, '')
}

function parseJson (req, res, ctx, done) {
  _parseJson(req, function (err, json) {
    if (err) return done(err)
    ctx.code = json.code
    done()
  })
}

function register (req, res, ctx, done) {
  github.oauth(ctx.code, handler)

  function handler (err, user) {
    if (err) return done(err)
    var opts = {
      github: { username: user.login }
    }
    auth.create(opts, done)
  }
}

function login (req, res, ctx, done) {
  github.oauth(ctx.code, function (err, user) {
    if (err) return done(err)
    var opts = {
      github: { username: user.login }
    }
    auth.verify('github', opts, done)
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
