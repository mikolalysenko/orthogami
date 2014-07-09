"use strict"

var pad = require('./lib/pad')
var getFaces = require('./lib/faces')
var getLinks = require('./lib/topo')
var unfold = require('./lib/unfold')
var render = require('./lib/render')

module.exports = orthogami

var palette = [
  "black",
  "red",
  "green",
  "blue",
  "gold",
  "purple",
  "tomato",
  "turquoise",
  "darkblue",
  "goldenrod",
  "aquamarine",
  "white"
]

function createColorMap(colors) {
  return function(v) {
    if(v in colors) {
      return colors[v]
    }
    return "black"
  }
}

function defaultColorMap(v) {
  return palette[(v>>>0)%palette.length]
}

function orthogami(voxels, options) {
  options = options || {}

  var padded = pad(voxels)
  var colorMap = options.colorMap
  if(typeof colorMap === "object") {
    colorMap = createColorMap(colorMap)
  } else if(typeof colorMap !== "function") {
    colorMap = defaultColorMap
  }

  var result      = getFaces(padded)
  var faces       = result[0]
  var normals     = result[1]
  var links       = getLinks(faces)
  
  return unfold(faces, links, normals).map(function(unfolding) {
    return render(
      padded,
      colorMap,
      unfolding.faces,
      unfolding.projections,
      unfolding.normals,
      unfolding.tabs,
      options)
  })
}