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

function nextVertex(loop, v) {
  var a = loop[v]
  for(var i=1; i<loop.length; ++i) {
    var u = (i + v) % loop.length
    var b = loop[u]

    var l0 = 0
    for(var j=0; j<3; ++j) {
      if(a[j] !== b[j]) {
        l0 += 1
      }
    }

    if(l0 === 0) {
      throw new Error('orthogami: double vertex (internal error)')
    }
    if(l0 === 1) {
      return u
    }

    //Walk vertex to get back to a
    while(i < loop.length) {
      b = loop[(i+v) % loop.length]
      if(compareVertex(a, b) === 0) {
        break
      }
      i = i + 1
    }
  }
  throw new Error('orthogami: degenerate facet (internal error)')
}

function orthoEdges(faces, normals) {

  var edges = {}
  for(var i=0; i<faces.length; ++i) {
    var f = faces[i]
    for(var j=0; j<f.length; ++j) {
      var a = j
      var b = nextVertex(f, j)
      var x = f[a]
      var y = f[b]

      if(compareVertex(x, y) < 0) {
        var tmp = x
        x = y
        y = tmp
      }
      var edgeID = x.join() + ':' + y.join()
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
      var edgeID = x.join() + ':' + y.join()
      var edge = edges[edgeID]
      var k = edge.indexOf(i)^1
      if(edge.length !== 2) {
        if(edge.length !== 4) {
          throw new Error('orthogami: broken edge, this is an internal error')
        }
        var edgeDirection = edgeDir(f[a], f[b])
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
          throw new Error('orthogami: error fixing non-manifold edge (internal error)')
        }
      }
      links[j] = edge[k]
    }
    adjacency[i] = links
  }

  return adjacency
}