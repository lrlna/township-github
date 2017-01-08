var html = require('choo/html')
var choo = require('choo')
var xhr = require('xhr')

var app = choo()
app.router([
  ['/done.html', doneView],
  ['/', mainView]
])
document.body.appendChild(app.start())

function mainView () {
  var buttonClass = 'f6 f5-ns fw6 dib ba b--black-20 bg-blue white ph3 ph4-ns pv2 pv3-ns br2 grow no-underline pointer'
  return html`
    <body class="">
      <main class="mw6 center">
        <h1>Login</h1>
        <button onclick=${redirect} class=${buttonClass}>
          Continue with GitHub
        </button>
      </main>
    </body>
  `
}

function doneView () {
  var code = window.location.href.match(/\?code=(.*)/)[1]
  var body = {
    code: code
  }
  var opts = {
    uri: '/login',
    json: json,
    method: 'POST'
  }

  xhr(opts, function (err, res, body) {
    if (err) return console.log(err)
  })

  return html`
    <a href="/">done</a>
  `
}

function redirect () {
  var url = '/redirect'
  xhr(url, function (err, res, body) {
    if (err) return console.log(err)

    var location = res.headers['x-github-oauth-redirect']
    window.location = location
  })
}
