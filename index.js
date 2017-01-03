var assert = require('assert')
var url = require('url')

module.exports = Github

function Github (opts) {
  if (!(this instanceof Github)) return new Github(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'township-github: opts should be type Object')

  this.secret = opts.GITHUB_SECRET || opts.secret
  this.name = opts.GITHUB_NAME || opts.name
  this.id = opts.GITHUB_ID || opts.id

  assert.equal(typeof this.secret, 'string', 'township-github: secret should be type String')
  assert.equal(typeof this.name, 'string', 'township-github: name should be type String')
  assert.equal(typeof this.id, 'string', 'township-github: id should be type String')

  this.redirectUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: '/login',
    query: {
      client_id: this.id,
      return_to: '/login/oauth/authorize?client_id=' + this.id
    }
  })

  this.redirectBody = `
    <html>
      <body>
        You are being <a href=${this.redirectUrl}>redirected</a>.
      </body>
    </html>
  `
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
    create: this._create(),
    verify: this._verify()
  }
}

Github.prototype._create = function () {
}

Github.prototype._verify = function () {
}

