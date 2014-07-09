"use strict"

var sgn = require('signum')
var cross = require('./cross')

module.exports = orthoEdges

function compareVertex(a, b) {
  for(var i=0; i<3; ++i) {
    var d = a[i] - b[i]
    if(d) {
      return d
    }
  }
  return 0
}

function edgeDir(a, b) {
  var r = [0,0,0]
  for(var i=0; i<3; ++i) {
    r[i] = sgn(a[i] - b[i])
  }
  return r
}

function orthoEdges(faces, normals) {
  var edges = {}
  for(var i=0; i<faces.length; ++i) {
    var f = faces[i]
    for(var j=0; j<f.length; ++j) {
      var a = j
      var b = (j + 1) % f.length
      var x = f[a]
      var y = f[b]
      if(compareVertex(x, y) < 0) {
        var tmp = x
        x = y
        y = tmp
      }
      var edgeID = x.join() + ":" + y.join()
      if(edgeID in edges) {
        edges[edgeID].push(i)
      } else {
        edges[edgeID] = [i]
      }
    }
  }

  var adjacency = new Array(faces.length)
  for(var i=0; i<faces.length; ++i) {
    var f = faces[i]
    var links = new Array(f.length)
    for(var j=0; j<f.length; ++j) {
      var a = j
      var b = (j + 1) % f.length
      var x = f[a]
      var y = f[b]
      if(compareVertex(x, y) < 0) {
        var tmp = x
        x = y
        y = tmp
      }
      var edgeID = x.join() + ":" + y.join()
      var edge = edges[edgeID]
      var k = edge.indexOf(i)^1
      console.log(edge)
      if(edge.length !== 2) {
        if(edge.length !== 4) {
          throw new Error("broken edge, this is an internal error")
        }
        var edgeDirection = edgeDir(f[a], f[b])
        console.log("nonmanifold:", edge, edgeDirection)
        for(var l=0; l<4; ++l) {
          if(edge[l] === i) {
            continue
          }
          var axis = cross(normals[edge[l]], normals[i])
          if(compareVertex(axis, edgeDirection) === 0) {
            k = l
            break
          }
        }
        if(l === 4) {
          throw new Error("error fixing non-manifold edge")
        }
      }
      console.log("linking:", i, edge[k])
      links[j] = edge[k]
    }
    console.log("links constructed for ", i, "=", links, "f=", f)
    adjacency[i] = links
  }

  return adjacency
}