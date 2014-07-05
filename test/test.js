"use strict"

var ndpack = require('ndarray-pack')
var facets = require('../lib/ortho-faces')

var cube = ndpack([
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,0,0] ],
[ [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0] ]])

console.log(facets(cube))