# township-github [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

GitHub provider for [township][township].

## Usage
```js
var Github = require('township-github')
var Auth = require('township-auth')
var merry = require('merry')
var level = require('level')

var db = level('users')
var app = merry()

var github = Github({
  returnUrl: '<some-browser-url-we-control>',
  secret: '<our-secret>',
  name: 'our-app',
  id: '<our-id>'
})

var auth = Auth(db, {
  providers: { github: github.provider() }
})

app.router([
  [ '/redirect', redirect ],
  [ '/register', register ],
  [ '/login', login ]
])

function redirect (req, res, ctx, next) {
  var html = github.redirect(req, res)
  next(null, html)
}

function register (req, res, ctx, done) {
  merry.parse.json(req, function (err, json) {
    if (err) return done(err)
    var opts = {
      github: { code: json.code }
    }
    auth.create(opts, function (err, account) {
      if (err) return done(err)
      done(null, account)
    })
  })
}

function login (req, res, ctx, done) {
  merry.parse.json(req, function (err, json) {
    if (err) return done(err)
    var opts = {
      github: { code: ctx.code }
    }
    auth.verify(opts, function (err, account) {
      if (err) return done(err)
      done(null, account)
    })
  })
}
```

## API
### github = Github(opts)
Create a new instance of `township-github`. Takes the following arguments:
- __opts.id:__ (required) the GitHub client ID
- __opts.secret:__ (required) the GitHub client secret
- __opts.name:__ (required) the GitHub application name for which id and secret
  were issued
- __opts.returnUrl:__ (required)

Alternatively `GITHUB_ID`, `GITHUB_SECRET`, `GITHUB_NAME` and `RETURN_URL` can
be used too, which is useful when passing variables directly from
`process.env`.

### html = github.redirect(req, res)
Set `302` redirect headers to the GitHub oauth page and return a snippet of
HTML.

### provider = github.provider()
Create a new provider for [township-auth][auth].

## See Also
- [township/township-auth][auth]
- [township/township][township]

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/township-github.svg?style=flat-square
[3]: https://npmjs.org/package/township-github
[4]: https://img.shields.io/travis/lrlna/township-github/master.svg?style=flat-square
[5]: https://travis-ci.org/lrlna/township-github
[6]: https://img.shields.io/codecov/c/github/lrlna/township-github/master.svg?style=flat-square
[7]: https://codecov.io/github/lrlna/township-github
[8]: http://img.shields.io/npm/dm/township-github.svg?style=flat-square
[9]: https://npmjs.org/package/township-github
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[auth]: https://github.com/township/township-auth
[township]: https://github.com/township/township
