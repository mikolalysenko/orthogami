"use strict"

var pad = require('./lib/pad')
var fillVoids = require('./lib/fill-voids')
var getFaces = require('./lib/faces')
var getLinks = require('./lib/topo')
var unfold = require('./lib/unfold')
var render = require('./lib/render')
var combinePieces = require('./lib/pack')

module.exports = orthogami

var palette = [
  'magenta',
  'blue',
  'green',
  'purple',
  'gold',
  'red',
  'bisque',
  'brown',
  'darkblue',
  'goldenrod',
  'aquamarine',
  'white',
  'black'
]

function createColorMap(colors) {
  return function(v) {
    if(v in colors) {
      return colors[v]
    }
    return 'black'
  }
}

function defaultColorMap(v) {
  return palette[(v>>>0)%palette.length]
}

function orthogami(voxels, options) {
  options = options || {}

  //Preprocess voxels to remove all voids
  var padded = pad(voxels)
  fillVoids(padded)

  //Load default color map
  var colorMap = options.colorMap
  if(typeof colorMap === 'object') {
    colorMap = createColorMap(colorMap)
  } else if(typeof colorMap !== 'function') {
    colorMap = defaultColorMap
  }

  //Page size bounds and scaling parameters
  var boxSize = options.bounds || [Infinity, Infinity]
  var scale = options.scale || 64
  if(typeof scale === 'number') {
    scale = [scale, scale]
  } else {
    scale = [64, 64]
  }
  var bounds = [0,0]
  for(var i=0; i<2; ++i) {
    bounds[i] = Math.floor(boxSize[i] / scale[i] - 2)
  }

  //Extract faces/normals from mesh
  var result      = getFaces(padded)
  var faces       = result[0]
  var normals     = result[1]

  //Compute topology
  var links       = getLinks(faces, normals)

  //Unwrap
  var unwrapped   = unfold(faces, links, normals, bounds)

  //Render to SVG
  var pieces = unwrapped.map(function(unfolding) {
    return render(
      padded,
      colorMap,
      unfolding.faces,
      unfolding.projections,
      unfolding.normals,
      unfolding.tabs,
      unfolding.creases,
      scale,
      options)
  })

  //Pack pieces into sheets
  return combinePieces(pieces, boxSize, scale)
}