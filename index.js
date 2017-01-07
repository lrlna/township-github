var explain = require('explain-error')
var concat = require('concat-stream')
var request = require('request')
var qs = require('querystring')
var assert = require('assert')
var xtend = require('xtend')
var pump = require('pump')
var url = require('url')

module.exports = Github

function Github (opts) {
  var ctx = {}
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'township-github: opts should be type Object')

  ctx.secret = opts.GITHUB_SECRET || opts.secret
  ctx.name = opts.GITHUB_NAME || opts.name
  ctx.id = opts.GITHUB_ID || opts.id

  assert.equal(typeof ctx.secret, 'string', 'township-github: secret should be type String')
  assert.equal(typeof ctx.name, 'string', 'township-github: name should be type String')
  assert.equal(typeof ctx.id, 'string', 'township-github: id should be type String')

  ctx.redirectUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: '/login',
    query: {
      client_id: ctx.id,
      return_to: '/login/oauth/authorize?client_id=' + ctx.id
    }
  })

  ctx.verifyOpts = {
    uri: 'https://github.com/login/oauth/access_token',
    method: 'POST'
  }

  ctx.userOpts = {
    uri: 'https://api.github.com/user',
    method: 'GET',
    headers: {
      'User-Agent': ctx.name
    }
  }
  ctx.provider = function (auth, options) {
    return {
      key: 'github.username',
      create: ctx._create,
      verify: ctx._verify
    }
  }

  ctx.redirect = function (req, res) {
    assert.equal(typeof req, 'object', 'township-github.redirect: req should be type Object')
    assert.equal(typeof res, 'object', 'township-github.redirect: res should be type Object')

    res.statusCode = 302
    res.setHeader('x-github-oauth-redirect', ctx.redirectUrl)
  }

  ctx._create = function (key, opts, cb) {
    var code = opts.code
    ctx._oauth(code, function (user) {
      var res = {
        username: user.login
      }

      cb(null, res)
    })
  }

  ctx._verify = function (opts, cb) {
    var code = opts.code
    ctx._oauth(code, function (user) {
      auth.db.get(opts.key, function (err, account) {
        if (err) return cb(err)
        cb(null, { key: account.key, github: { username: account.github.username } })
      })
    })
  }

  ctx._oauth = function (code, cb) {
    assert.equal(typeof code, 'string', 'township-github._oauth: code should be type String')
    assert.equal(typeof cb, 'function', 'township-github._oauth: cb should be type Function')

    var opts = xtend(ctx.verifyOpts, {
      qs: {
        client_secret: ctx.secret,
        client_id: ctx.id,
        code: code
      }
    })

    var req = request(opts)
    _parseBody(req, function (err, obj) {
      if (err) return cb(err)
      if (!obj) return cb(new Error('township-github._oauth: no response body received from GitHub'))
      if (!obj.access_token) return cb(new Error('township-github._oauth: no access_token in body received from GitHub'))

      var token = obj.access_token

      ctx._getUser(token, cb)
    })
  }

  ctx._getUser = function (token, cb) {
    assert.equal(typeof token, 'string', 'township-github._getUser: token.access_token should be type String')
    assert.equal(typeof cb, 'function', 'township-github._getUser: cb should be type Function')

    var opts = xtend(ctx.userOpts, {
      qs: { access_token: token }
    })

    var req = request(opts)
    pump(req, concat({ encoding: 'string' }, handler), function (err) {
      if (err) return cb(explain(err, 'township-github._getUser: pipe error'))
    })

    function handler (obj) {
      var user = JSON.parse(obj)
      cb(user)
    }
  }

  return ctx
}

function _parseBody (res, cb) {
  pump(res, concat({ encoding: 'string' }, handler), function (err) {
    if (err) return cb(explain(err, 'township-github._getUser: pipe error'))
  })

  function handler (str) {
    try {
      var obj = qs.parse(str)
    } catch (err) {
      return cb(explain(err, 'township-github._parseBody: error parsing string'))
    }
    cb(null, obj)
  }
}
