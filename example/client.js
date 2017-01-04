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
  return html`
    <p>hi</p>
  `
}

function doneView () {
  return html`
    <p>doneee</p>
  `
}
