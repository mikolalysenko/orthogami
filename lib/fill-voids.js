'use strict'

var ndarray = require('ndarray')

module.exports = fillVoids

function fillVoids(voxels) {
  var toVisit = [[0,0,0]]
  var visited = ndarray(new Uint8Array(voxels.size), voxels.shape)
  visited.set(0,0,0,1)
  var shape = voxels.shape.slice()
  while(toVisit.length > 0) {
    var x = toVisit.shift()
    for(var d=0; d<3; ++d) {
s_loop:
      for(var s=-1; s<=1; s+=2) {
        var y = x.slice()
        y[d] += s
        for(var i=0; i<3; ++i) {
          if(y[i] < 0 || shape[i] <= y[i]) {
            continue s_loop
          }
        }
        if(visited.get(y[0], y[1], y[2])) {
          continue s_loop
        }
        visited.set(y[0], y[1], y[2], 1)
        if(!voxels.get(y[0], y[1], y[2])) {
          toVisit.push(y)
        }
      }
    }
  }

  //Fill in all internal voids
  for(var i=0; i<shape[0]; ++i) {
    for(var j=0; j<shape[1]; ++j) {
      for(var k=0; k<shape[2]; ++k) {
        if(!visited.get(i,j,k)) {
          voxels.set(i,j,k,1)
        }
      }
    }
  }
}