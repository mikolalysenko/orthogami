var ndarray = require('ndarray')
var ops = require('ndarray-ops')

var show = require('ndarray-show')

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
  var center = result.lo(1,1,1)
    .hi(voxels.shape[0], voxels.shape[1], voxels.shape[2])
  ops.assign(center, voxels)

  console.log(show(result))

  return result
}