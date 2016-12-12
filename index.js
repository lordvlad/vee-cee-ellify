const through = require('through2')
const falafel = require('falafel')
const endsWith = require('ends-with')
const vcl = require('vcl-preprocessor')
const {resolve, dirname} = require('path')
const fs = require('fs')

const opt = {
  ecmaVersion: 8,
  sourceType: 'module'
}

function insert (file, styles) {
  styles = styles
    .replace(/`/g, '\\`')
    .replace(/\\([0-9a-f])/ig, '\\\\$1')
  return `;require('insert-css')(\`
/* ${file} */
${styles}
\`);`
}

function isStyle (node) {
  return node.callee &&
    node.callee.name === 'require' &&
    endsWith(node.arguments[0].value, '.styl')
}

module.exports = function (file) {
  return through(function (buf, charset, done) {
    let s = falafel(buf, opt, function (node) {
      if (!isStyle(node)) return
      let m = node.arguments[0].value
      let d = dirname(file)
      let f = require.resolve(resolve(d, m))
      let c = fs.readFileSync(f, 'utf8')
      let s = vcl(c, {root: d}).toString()
      node.update(insert(file, s))
    }).toString()
    this.push(s)
    done()
  })
}

