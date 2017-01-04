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
  if (!(this instanceof Github)) return new Github(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'township-github: opts should be type Object')

  this.returnUrl = opts.GITHUB_RETURN_URL || opts.returnUrl
  this.secret = opts.GITHUB_SECRET || opts.secret
  this.name = opts.GITHUB_NAME || opts.name
  this.id = opts.GITHUB_ID || opts.id

  assert.equal(typeof this.returnUrl, 'string', 'township-github: returnUrl should be type String')
  assert.equal(typeof this.secret, 'string', 'township-github: secret should be type String')
  assert.equal(typeof this.name, 'string', 'township-github: name should be type String')
  assert.equal(typeof this.id, 'string', 'township-github: id should be type String')

  this.redirectUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: '/login',
    query: {
      client_id: this.id,
      return_to: this.returnUrl + '?client_id=' + this.id
    }
  })

  this.redirectBody = `
    <html>
      <body>
        You are being <a href=${this.redirectUrl}>redirected</a>.
      </body>
    </html>
  `

  this.verifyOpts = {
    uri: 'https://github.com/login/oauth/access_token',
    method: 'POST'
  }

  this.userOpts = {
    uri: 'https://api.github.com/user',
    method: 'GET',
    headers: {
      'User-Agent': this.name
    }
  }
}

Github.prototype.redirect = function (req, res) {
  assert.equal(typeof req, 'object', 'township-github.redirect: req should be type Object')
  assert.equal(typeof res, 'object', 'township-github.redirect: res should be type Object')

  res.statusCode = 302
  res.setHeader('Location', this.redirectUrl)

  return this.redirectBody
}

Github.prototype.provider = function () {
  return {
    key: 'github.username',
    create: this._create,
    verify: this._verify
  }
}

Github.prototype._create = function (key, opts, cb) {
  var code = opts.code
  this._oauth(code, function (user) {
  })
}

Github.prototype._verify = function (opts, cb) {
  var code = opts.code
  this._oauth(code, function (user) {
  })
}

Github.prototype._oauth = function (code, cb) {
  assert.equal(typeof code, 'string', 'township-github._oauth: code should be type String')
  assert.equal(typeof cb, 'function', 'township-github._oauth: cb should be type Function')

  var self = this

  var opts = xtend(this.verifyOpts, {
    qs: {
      client_secret: this.secret,
      client_id: this.id,
      code: code
    }
  })

  var req = request(opts)
  _parseBody(req, function (err, obj) {
    if (err) return cb(err)
    if (!obj) return cb(new Error('township-github._oauth: no response body received from GitHub'))
    if (!obj.access_token) return cb(new Error('township-github._oauth: no access_token in body received from GitHub'))

    var token = obj.access_token

    self._getUser(token, cb)
  })
}

Github.prototype._getUser = function (token, cb) {
  assert.equal(typeof token, 'string', 'township-github._getUser: token.access_token should be type String')
  assert.equal(typeof cb, 'function', 'township-github._getUser: cb should be type Function')

  var opts = xtend(this.userOpts, {
    qs: { access_token: token }
  })

  var req = request(opts)
  pump(req, concat({ encoding: 'string' }, handler), function (err) {
    if (err) return cb(explain(err, 'township-github._getUser: pipe error'))
  })

  function handler (user) {
    cb(null, user)
  }
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
