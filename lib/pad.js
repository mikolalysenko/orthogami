"use strict"

var ndarray = require("ndarray")
var ops = require("ndarray-ops")

module.exports = padVoxels

function padVoxels(voxels) {
  var nshape = voxels.shape.slice()
  var size = 1
  for(var i=0; i<nshape.length; ++i) {
    nshape[i] += 2
    size *= nshape[i]
  }
  var result = ndarray(new Array(size), nshape)
  ops.assigns(result, 0.0)
  ops.assign(result.lo(1,1,1).hi(voxels.shape), voxels)
  return result
}