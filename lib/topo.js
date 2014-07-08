"use strict"

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

function orthoEdges(faces) {
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
      console.log(edge, edgeID)
      if(edge.length !== 2) {
        throw new Error("non-manifold edges not supported yet")
      } else {
        var k = edge.indexOf(i) ^ 1
        links[j] = edge[k]
      }
    }
    adjacency[i] = links
  }

  return adjacency
}