"use strict"

var ndpack = require('ndarray-pack')
var unfold = require('../index')
var fs = require('fs')

var cube = ndpack([
[ [5,5,5,5],
  [5,0,5,5],
  [5,5,0,5],
  [5,5,5,5] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ]])

unfold(cube, {bounds: [1000, 500]}).map(function(svg, idx) {
  console.log("data:", idx, "--:")
  console.log(svg)
  fs.writeFileSync("page" + idx + ".svg", svg)
})