"use strict"

var project = require('./project')
var ndarray = require('ndarray')
var ops = require('ndarray-ops')
var sgn = require('signum')

var util = require('util')

module.exports = renderUnfoldingToSVG

function renderFaceToSVG(
  voxels, 
  colorMap, 
  face, 
  normal, 
  projection, 
  scale,
  strokeDash,
  strokeWidth,
  strokeColor) {

  var svg = []
  var bounds = [[Infinity,Infinity], [-Infinity,-Infinity]]

  var pface = new Array(face.length)
  for(var i=0; i<face.length; ++i) {
    pface[i] = project(projection, face[i])
    for(var j=0; j<2; ++j) {
      bounds[0][j] = Math.min(bounds[0][j], scale[j]*pface[i][j])
      bounds[1][j] = Math.max(bounds[1][j], scale[j]*pface[i][j])
    }
  }

  //Draw all the voxels for this face
  var d = 0
  var x = 0
  for(d=0; d<3; ++d) {
    if(normal[d] !== 0) {
      x = face[0][d]
      if(normal[d] > 0) {
        x -= 1
      }
      break
    }
  }
  var u = (d+1) % 3
  var v = (d+2) % 3
  var n = voxels.shape[u]
  var m = voxels.shape[v]

  console.log(face, normal, x, d)

  //Next, mask out the interior level for this facet
  var scanlines = {}
  for(var i=0; i<face.length; ++i) {
    var a = face[i]
    var b = face[(i+1)%face.length]
    if(a[u] === b[u]) {
      continue
    }
    var y = a[v]
    var l = Math.min(a[u], b[u])
    var h = Math.max(a[u], b[u])
    for(var j=l; j<h; ++j) {
      if(scanlines[j]) {
        scanlines[j].push(y)
      } else {
        scanlines[j] = [y]
      }
    }
  }
  var keys = Object.keys(scanlines)
  for(var i=0; i<keys.length; ++i) {
    var y = keys[i]|0
    var scans = scanlines[y]
    scans.sort(function(a,b) { return a-b })
    for(var j=0; j<scans.length; ++j) {
      var l = scans[j]
      var h = scans[j+1]
      for(var k=l; k<h; ++k) {
        var coord = [0,0,0]
        coord[d] = x
        coord[u] = y
        coord[v] = k
        var value = voxels.get.apply(voxels, coord)
        console.log("read:", coord, "value:", value)
        var color = colorMap(value)
        svg.push('<path stroke="', color, '" fill="', color, '" d="')
        var path = []
        for(var du=0; du<2; ++du) {
          for(var dv=0; dv<2; ++dv) {
            var pcoord = coord.slice()
            pcoord[u] += du
            pcoord[v] += dv
            var ncoord = project(projection, pcoord)
            for(var xx=0; xx<2; ++xx) {
              ncoord[xx] *= scale[xx]
            }
            path.push(ncoord)
          }
        }
        var tmp = path[0]
        path[0] = path[1]
        path[1] = tmp

        var start = path[path.length-1]
        svg.push('M', start[0], ' ', start[1])
        for(var xx=0; xx<path.length; ++xx) {
          var vertex = path[xx]
          svg.push(' L', vertex[0], ' ', vertex[1])
        }
        svg.push('" />')
      }
    }
  }

  //Draw fold lines
  var start = pface[pface.length-1]
  svg.push(
    '<path stroke-width="', strokeWidth, '" ',
          //'stroke-dasharray="', strokeDash.join(), '" ',
          'stroke="', strokeColor, '" ',
          'fill="none" d="M', start[0]*scale[0], ' ', start[1]*scale[1])
  for(var i=0; i<pface.length; ++i) {
    var v = pface[i]
    svg.push(' L', v[0]*scale[0], ' ', v[1]*scale[1])
  }
  svg.push('" />')

  return [svg.join(''), bounds]
}

function renderTab(
  tabId, 
  edge, 
  open, 
  orientation, 
  scale, 
  tabSize,
  strokeDash,
  strokeWidth,
  strokeColor) {

  var svg = []

  var a = edge[0]
  var b = edge[1]
  var perp = orientation
  var par = [ sgn(b[0] - a[0]), sgn(b[1] - a[1]) ]

  function generateTab(outerOffset, innerOffset, depth) {
    var path = []
    path.push(
        [ scale[0]*(a[0] + outerOffset*par[0]),
          scale[1]*(a[1] + outerOffset*par[1]) ],
        [ scale[0]*(a[0] + innerOffset*par[0] + depth*perp[0]),
          scale[1]*(a[1] + innerOffset*par[1] + depth*perp[1]) ],
        [ scale[0]*(b[0] - innerOffset*par[0] + depth*perp[0]),
          scale[1]*(b[1] - innerOffset*par[1] + depth*perp[1]) ],
        [ scale[0]*(b[0] - outerOffset*par[0]),
          scale[1]*(b[1] - outerOffset*par[1]) ])

    var start = path[0]
    svg.push(
      '<path ',
      'stroke-width="', strokeWidth, '" ',
      'stroke-dasharray="', strokeDash.join(), '" ',
      'stroke="', strokeColor, '" ',
      'fill="none" d="M', start[0], ' ', start[1])
    for(var i=1; i<path.length; ++i) {
      svg.push(' L', path[i][0], ' ', path[i][1])
    }
    svg.push('" />')
  }

  if(open) {
    generateTab(0.1, 0.2, 0.18)
    generateTab(0.2, 0.2, 0.075)
  } else {
    generateTab(0.25, 0.25, 0.25)
  }

  //Add text labels for tabs
  var center = [0.5 * (a[0] + b[0]) + 0.1*perp[0], 
                0.5 * (a[1] + b[1]) + 0.1*perp[1]]
  svg.push('<text x="', scale[0]*center[0], '" y="',
      scale[1]*center[1], '" font-size="', Math.min(scale[0], scale[1]) * 0.1, 
      '" fill="', strokeColor, '">', tabId, '</text>')

  return svg.join('')
}

function renderUnfoldingToSVG(
  voxels, 
  colorMap, 
  faces, 
  projections, 
  normals,
  tabs,
  options) {

  console.log(util.inspect(tabs, {depth: 10}))

  var scale = options.scale || [64, 64]
  if(typeof scale === "number") {
    scale = [scale, scale]
  }
  var defaultDash = Math.min(scale[0], scale[1]) / 32.0
  var strokeDash = options.dash || [defaultDash, 0.25*defaultDash]
  var strokeWidth = options.lineWidth || 1
  var strokeColor = options.lineColor || "black"
  var tabSize = options.tabSize || 0.5 * Math.min(scale[0], scale[1])

  var bounds = [[Infinity,Infinity], [-Infinity,-Infinity]]
  var guts = []

  //Draw all facets
  for(var i=0; i<faces.length; ++i) {
    var result = renderFaceToSVG(
      voxels, 
      colorMap, 
      faces[i], 
      normals[i], 
      projections[i], 
      scale,
      strokeDash,
      strokeWidth,
      strokeColor)
    guts.push(result[0])
    var b = result[1]
    for(var j=0; j<2; ++j) {
      bounds[0][j] = Math.min(b[0][j], bounds[0][j])
      bounds[1][j] = Math.max(b[1][j], bounds[1][j])
    }
  }

  //Draw all the tabs
  for(var i=0; i<tabs.length; ++i) {
    var tab = tabs[i]
    var result = renderTab(
        tab.id, 
        tab.coords, 
        tab.open, 
        tab.orientation, 
        scale, 
        tabSize,
        strokeDash,
        strokeWidth,
        strokeColor)
    guts.push(result)
  }

  //Write final svg header
  var svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ',
    'width="', Math.ceil(2*scale[0]+bounds[1][0]-bounds[0][0])|0, '" ',
    'height="', Math.ceil(2*scale[1]+bounds[1][1]-bounds[0][1])|0, '">',
    '<g transform="translate(', scale[0]-bounds[0][0], ',', scale[1]-bounds[0][1], ')">']
  svg.push.apply(svg, guts)
  svg.push('</g></svg>')

  return svg.join('')
}