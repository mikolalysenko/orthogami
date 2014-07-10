"use strict"

var ndpack = require('ndarray-pack')
var unfold = require('../index')
var fs = require('fs')

var cube = ndpack([

  /*
[ [0,0,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,1,1,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ]
  */

[ [1,0],
  [1,0],
  [1,0],
  [1,0] ],
[ [1,1],
  [1,1],
  [1,1],
  [1,0] ]
  ])

unfold(cube, {bounds: [1000, 500]}).map(function(svg, idx) {
  console.log("data:", idx, "--:")
  console.log(svg)
  fs.writeFileSync("page" + idx + ".svg", svg)
})