"use strict"

var ndpack = require('ndarray-pack')
var unfold = require('../index')
var fs = require('fs')

var cube = ndpack([
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,1,2,0],
  [0,0,3,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ]])

unfold(cube).map(function(svg, idx) {
  console.log(svg)
  fs.writeFileSync("page" + idx + ".svg", svg)
})