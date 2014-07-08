var sgn = require("signum")

module.exports = unfoldPolyhedra

function compareV(a, b) {
  for(var i=0; i<a.length; ++i) {
    var d = a[i] - b[i]
    if(d) {
      return d
    }
  }
  return 0
}

function edgeName(a, b) {
  if(compareV(a, b) < 0) {
    return a.join() + ":" + b.join()
  } else {
    return b.join() + ":" + a.join()
  }
}

function findV(loop, v) {
  for(var i=0; i<loop.length; ++i) {
    if(compareV(loop[i], v) === 0) {
      return i
    }
  }
  return -1
}

function project(P, x) {
  var result = [0,0]
  for(var i=0; i<2; ++i) {
    result[i] = P[4*i+3]
    for(var j=0; j<3; ++j) {
      result[i] += x[j] * P[4*i+j]
    }
  }
  var w = P[11]
  for(var j=0; j<3; ++j) {
    w += x[j] * P[8+j]
  }
  for(var i=0; i<2; ++i) {
    result[i] /= w
  }
  return result
}

function dot(a, b) {
  var s = 0.0
  for(var i=0; i<a.length; ++i) {
    s += a[i] * b[i]
  }
  return s
}

function unitDiff(a, b) {
  var r = new Array(a.length)
  for(var i=0; i<a.length; ++i) {
    r[i] = sgn(a[i] - b[i])
  }
  return r
}

function projectFacet(P, loop) {
  var result = new Array(loop.length)
  for(var i=0; i<loop.length; ++i) {
    result[i] = project(P, loop[i])
  }
  return result
}

function writeFacet(map, face, incomingEdge) {
  var edgeList = {}
  var boundaryPoints = []
  for(var i=0; i<face.length; ++i) {
    var a = face[i]
    var b = face[(i+1)%face.length]
    var d = 0
    if(a[1] !== b[1]) {
      d = 1
      var x = a[0]
      var l = Math.min(a[1], b[1])
      var h = Math.max(a[1], b[1])
      for(var j=l; j<h; ++j) {
        if(j in edgeList) {
          edgeList[j].push(x)
        } else {
          edgeList[j] = [x]
        }
      }
    }
    //Don't test boundary points on incoming edge
    if(incomingEdge && 
      compareV(a, incomingEdge[0]) === 0 &&
      compareV(b, incomingEdge[1]) === 0) {
      continue
    }
    //Test boundary points
    var x = [a[0], a[1]]
    if(a[d] < b[d]) {
      x[d^1] -= 1
    } else {
      x[d^1] += 1
    }
    for(x[d]=Math.min(a[d], b[d]); x[d]<Math.max(a[d], b[d]); ++x[d]) {
      var tok = x[0] + ':' + x[1]
      if(map[tok]) {
        return false
      }
    }
  }
  //Scan convert quad, check for collisions
  var keys = Object.keys(edgeList)
  var points = []
  for(var i=0; i<keys.length; ++i) {
    var x = +keys[i]
    var e = edgeList[x]
    e.sort(function(a,b) { return a - b })
    for(var j=0; j<e.length; j+=2) {
      var l = e[j]
      var h = e[j+1]
      for(var y=l; y<h; ++y) {
        var tok = x + ":" + y
        if(map[tok]) {
          return false
        }
        points.push(tok)
      }
    }
  }
  //Write points to map
  for(var i=0; i<points.length; ++i) {
    map[points[i]] = true
  }
  return true
}

function unfoldPolyhedra(faces, links, normals) {
  var visited = new Array(faces.length)
  for(var i=0; i<faces.length; ++i) {
    visited[i] = false
  }

  var unfoldings = []

  var edgeCounter = 0
  var edgeNames = {}

  for(var i=0; i<faces.length; ++i) {
    if(visited[i]) {
      continue
    }
    visited[i] = true

    var toVisit = [i]
    var normal = normals[i]
    var unfoldMap = [[0,0,0,0,
                      0,0,0,0,
                      0,0,0,1]]
    var collisionMap = {}    
    for(var j=0; j<3; ++j) {
      var u = (j+1) % 3
      var v = (j+2) % 3
      unfoldMap[0][j] = normal[u]
      unfoldMap[0][4+j] = normal[v]
    }

    var mapList = [ unfoldMap[0] ]
    var faceList = [ faces[i] ]
    var edgeList = [ ]
    writeFacet(collisionMap,  projectFacet(unfoldMap[0], faces[i]))

    function pushEdge(a, b, P) {
      console.log("pushedge:", a, b, P)
      var ename = edgeName(a, b)
      var enumber
      if(ename in edgeNames) {
        enumber = edgeNames[ename]
      } else {
        enumber = edgeNames[ename] = edgeCounter++
      }

      edgeList.push({
        id: enumber,
        coords: [project(P, a), project(P, b)]
      })
    }

    while(toVisit.length > 0) {
      var cur = toVisit.shift()
      var P   = unfoldMap.shift()
      var n   = normals[cur]
      var f   = faces[cur]
      var link   = links[cur]
      for(var j=0; j<f.length; ++j) {
        var nidx = link[j]
        var a = f[j]
        var b = f[(j+1)%f.length]
        var c = f[(j+2)%f.length]

        if(visited[nidx]) {
          pushEdge(a, b, P)
          continue
        }

        var neighbor = faces[nidx]
        
        //TODO: Check for a concave edge

        var pa = project(P, a)
        var pb = project(P, b)
        var pc = project(P, c)

        var q = findV(neighbor, a)
        var q0 = neighbor[q]
        var q1 = neighbor[(q+1)%neighbor.length]
        var q2 = neighbor[(q+2)%neighbor.length]

        //Check normal for next facet
        var ln = [0,0,0]
        if(q1 === b) {
          throw new Error("cooriented faces")
          continue
        } else {
          ln = unitDiff(q0, q1)
        }
        
        //Visit link f[j]
        for(var k=0; k<2; ++k) {
          if(pa[k] !== pb[k]) {
            continue
          }
          var Q = [0,0,0,0,
                   0,0,0,0,
                   0,0,0,1]

          //Solve for Q
          var o = k^1
          if(pa[k] > pc[k]) {
            for(var l=0; l<3; ++l) {
              ln[l] = -ln[l]
            }
          }

          for(var l=0; l<3; ++l) {
            Q[4*o + l] = P[4*o + l]
            Q[4*k + l] = ln[l]
          }
          Q[4*o + 3] = P[4*o + 3]
          Q[4*k + 3] = pa[k] - dot(ln, a)

          //Unfold facet
          var nfacet = projectFacet(Q, neighbor)

          if(writeFacet(collisionMap, nfacet, [b, a])) {
            visited[nidx] = true
            toVisit.push(nidx)
            unfoldMap.push(Q)
            faceList.push(neighbor)
            mapList.push(Q)
          } else {
            pushEdge(a, b, P)
          }
          break
        }
      }
    }

    unfoldings.push({
      projections: mapList,
      faces: faceList,
      edges: edgeList
    })
  }

  return unfoldings
}