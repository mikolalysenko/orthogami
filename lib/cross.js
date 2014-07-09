'use strict'

module.exports = crossProduct

function crossProduct(x, y) {
  var r = [0,0,0]
  for(var i=0; i<3; ++i) {
    var u = (i+1)%3
    var v = (i+2)%3
    r[i] = x[u]*y[v] - x[v]*y[u]
  }
  return r
}