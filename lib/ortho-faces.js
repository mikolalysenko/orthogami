"use strict"

var contour = require('contour-2d')
var ndarray = require('ndarray')
var ops = require('ndarray-ops')

var unpack = require('ndarray-unpack')

module.exports = extractFaces

//Assume volume is binary and 0 padded
function extractFaces(volume) {
  var result = []

  //For each axis, extract all facets
  for(var d=0; d<3; ++d) {
    var u = (d+1) % 3
    var v = (d+2) % 3

    var n = volume.shape[d]
    var m = volume.shape[u]
    var l = volume.shape[v]

    var x = ndarray(new Uint8Array(m * l), [m, l])
    
    for(var i=1; i<n-1; ++i) {

      console.log("i", i)
      var slice0, slice1, slice2
      if(d === 0) {
        slice0 = volume.pick(i-1)
        slice1 = volume.pick(i)
        slice2 = volume.pick(i+1)
      } else if(d === 1) {
        slice0 = volume.pick(-1, i-1)
        slice1 = volume.pick(-1, i)
        slice2 = volume.pick(-1, i+1)
      } else if(d === 2) {
        slice0 = volume.pick(-1, -1, i-1)
        slice1 = volume.pick(-1, -1, i)
        slice2 = volume.pick(-1, -1, i+1)
      }

      for(var s=0; s<m; ++s) {
        for(var t=0; t<l; ++t) {
          x.set(s, t, slice0.get(s,t) !== slice1.get(s,t))
        }
      }

      var f = contour(x, true)
      for(var j=0; j<f.length; ++j) {
        result.push(f[j].map(function(p) {
          var y = [i,i,i]
          y[u] = p[0]
          y[v] = p[1]
          return y
        }))
      }


      for(var s=0; s<m; ++s) {
        for(var t=0; t<l; ++t) {
          x.set(s, t, slice1.get(s,t) !== slice2.get(s,t))
        }
      }
      var f = contour(x, true)
      for(var j=0; j<f.length; ++j) {
        f[j].reverse()
        result.push(f[j].map(function(p) {
          var y = [i,i,i]
          y[u] = p[0]
          y[v] = p[1]
          return y
        }))
      }
    }
  }

  return result
}