"use strict"

var ndpack = require('ndarray-pack')
var facets = require('../lib/faces')
var connect = require('../lib/topo')
var unfold = require('../lib/unfold')
var inspect = require('util').inspect
var fs = require('fs')

var cube = ndpack([
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,1,1,0],
  [0,0,1,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ]])

var f = facets(cube)
console.log(inspect(f, {depth:10}))

var links = connect(f[0])
console.log(links)

var unfolding = unfold(f[0], links, f[1])
console.log(inspect(unfolding, {depth:10}))

/*

var svg = []
var shift = [0,0]
svg.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  width="500"  height="80" >')
unfolding.forEach(function(loops) {
  loops.forEach(function(loop) {
    svg.push('<path d="')
    var start = loop[0]
    svg.push('M ' + (10*start[0]+shift[0])+ ' ' + 10*start[1])
    for(var i=1; i<loop.length; ++i) {
      var p = loop[i]
      svg.push('L ' + (10*p[0]+shift[0]) + ' ' + 10*p[1])
    }
    svg.push('L ' + (10*start[0]+shift[0]) + ' ' + 10*start[1])
    svg.push('" stroke-width="1" fill="red"></path>')
  })

  shift[0] += 50
})
svg.push('</svg>')

fs.writeFileSync("test.svg", svg.join(""))
*/