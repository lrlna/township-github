var Github = require('./')
var Auth = require('township-auth')
var merry = require('merry')
var level = require('level')

var env = merry.env({
  'GITHUB_SECRET': String,
  'GITHUB_NAME': String,
  'GITHUB_ID': String
})

var db = level('users')
var app = merry()

var github = Github(env)
var auth = Auth(db, {
  providers: { github: github.provider() }
})

app.router([
  ['/oauth/github/register', register],
  ['/githubLogin', login],
  ['/redirect', function (req, res, ctx, next) {
    var body = github.redirect(req, res)
    next(null, body)
  }]
])

function register (req, res, ctx, done) {
  auth.create({
    github: { code: ctx.code }
  }, function (err, account) {
    if (err) return console.error(err)
    console.log(account)
  })
}

function login (req, res, ctx, done) {
  auth.verify({
    github: { code: ctx.code }
  }, function (err, account) {
    if (err) return console.error(err)
    console.log(account)
  })
}
