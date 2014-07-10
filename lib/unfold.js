var sgn = require('signum')
var project = require('./project')
var projectN = project.normal
var cross = require('./cross')

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

function computeBounds(facet) {
  var bounds = [[Infinity, Infinity], [-Infinity,-Infinity]]
  for(var i=0; i<facet.length; ++i) {
    var v = facet[i]
    for(var j=0; j<2; ++j) {
      bounds[0][j] = Math.min(bounds[0][j], v[j])
      bounds[1][j] = Math.max(bounds[1][j], v[j])
    }
  }
  return bounds
}

function edgeName(a, b) {
  if(compareV(a, b) < 0) {
    return a.join() + ":" + b.join()
  } else {
    return b.join() + ":" + a.join()
  }
}

function findE(loop, a, b) {
  for(var i=0; i<loop.length; ++i) {
    var x = loop[(i-1+loop.length) % loop.length]
    var y = loop[i]
    if(compareV(x, a) === 0 && 
       compareV(y, b) === 0) {
      return i
    }
  }
  return -1
}

function dot(a, b) {
  var s = 0.0
  for(var i=0; i<a.length; ++i) {
    s += a[i] * b[i]
  }
  return s
}

function triple(a, b, c) {
  return dot(cross(a,b), c)
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
      if(a[0] !== b[0]) {
        continue
      }

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
      if(d === 0) {
        x[1] -= 1
      }
    } else {
      if(d === 1) {
        x[0] -= 1
      }
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
        var tok = y + ":" + x
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

function nextVertex(loop, v) {
  var a = loop[(v-1+loop.length)%loop.length]
  var b = loop[v]


  console.log('next vertex', a, b, v)

  var d = 0
  for(var i=0; i<3; ++i) {
    if(a[i] !== b[i]) {
      d = i
      break
    }
  }

  console.log('d=', d)

  var prev = b
  for(var i=1; i<loop.length; ++i) {
    var c = loop[(v+i) % loop.length]

    //Test candidate for c
    var p = -1
    for(var j=0; j<3; ++j) {
      if(j === d) {
        continue
      }
      if(c[j] !== b[j]) {
        p = j
        break
      }
    }

    //If c is collinear, then continue
    if(p < 0) {
      prev = c
      continue
    }

    //Test for internal edge
    if(prev[d] !== c[d]) {
      //Scan until we hit end of loop
      while(i < loop.length) {
        i = i + 1
        var q = loop[(v+i) % loop.length]
        if(compareV(q, c) === 0) {
          break
        }
      }
      continue
    }

    //Success, return a fake point
    var result = b.slice()
    result[p] = c[p]
    return result
  }

  throw new Error('orthogami: degenerate facet, this should never happen')
}

function unfoldPolyhedra(faces, links, normals, boxSize) {
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
      unfoldMap[0][j] = -Math.abs(normal[u])
      unfoldMap[0][4+j] = normal[v]
    }

    console.log("initial map:", normal, unfoldMap[0])

    var mapList = [ unfoldMap[0] ]
    var faceList = [ faces[i] ]
    var normalList = [ normal ]
    var edgeList = []
    var creaseList = []
    var pfacet0 = projectFacet(unfoldMap[0], faces[i])
    var bounds = computeBounds(pfacet0)

    console.log('face bounds', bounds, boxSize)

    for(var j=0; j<2; ++j) {
      if(bounds[1][j] - bounds[0][j] > boxSize[j]) {
        throw new Error('orthogami: face too big. use a larger bound or smaller scale')
      }
    }

    writeFacet(collisionMap, pfacet0)

    function clearEdge(a, b, P, Q, pn, qn, f0, f1) {
      var ename = edgeName(a, b) + "-" + Math.min(f0,f1) + "/" + Math.max(f0,f1)

      console.log("clearing:", ename)
      edgeNames[ename] = -1

      //Check crease concavity
      var d = [0,0,0]
      for(var i=0; i<3; ++i) {
        d[i] = a[i] - b[i]
      }
      var convex = triple(d, pn, qn) < 0

      creaseList.push({
        coords: [project(P, a), project(P, b)],
        convex: convex
      })

      console.log("added crease:", a, b, convex)
    }

    function pushEdge(a, b, P, f0, f1) {
      var ename = edgeName(a, b) + "-" + Math.min(f0,f1) + "/" + Math.max(f0,f1)
      var enumber
      var first = true
      if(ename in edgeNames) {
        enumber = edgeNames[ename]
        first = false
      } else {
        enumber = edgeNames[ename] = edgeCounter++
      }

      if(enumber < 0) {
        return
      }

      var pa = project(P, a)
      var pb = project(P, b)
      var orientation = [0,0]
      if(pa[0] === pb[0]) {
        if(pa[1] < pb[1]) {
          orientation[0] = 1
        } else {
          orientation[0] = -1
        }
      } else {
        if(pa[0] < pb[0]) {
          orientation[1] = -1
        } else {
          orientation[1] = 1
        }
      }

      edgeList.push({
        id: enumber,
        coords: [pa, pb],
        open: first,
        orientation: orientation
      })
    }

    while(toVisit.length > 0) {
      var cur = toVisit.shift()
      var P   = unfoldMap.shift()
      var n   = normals[cur]
      var f   = faces[cur]
      var link   = links[cur]
    
      console.log("visit:", cur, link, f[0], n, toVisit)

      for(var j=0; j<f.length; ++j) {
        var nidx = link[j]
        var a = f[j]
        var b = f[(j+1)%f.length]
        var c = nextVertex(f, (j+1)%f.length)

        console.log("walk to:", nidx, a, b)

        if(visited[nidx]) {
          console.log("visited, skipping")
          if(nidx !== cur) {
            pushEdge(a, b, P, cur, nidx)
          } else {
            console.log("skipping internal edge")
          }
          continue
        }

        var neighbor = faces[nidx]

        var pa = project(P, a)
        var pb = project(P, b)
        var pc = project(P, c)

        var q = findE(neighbor, b, a)
        if(q < 0) {
          throw new Error('orthogami: internal error, cooriented faces')
        }

        //Walk until we have an appropriate edge
        var q0 = neighbor[q]
        var q1 = nextVertex(neighbor, q)
        var ln = unitDiff(q0, q1)

        if(Math.abs(ln[0]) + Math.abs(ln[1]) + Math.abs(ln[2]) !== 1) {
          console.log(neighbor, q, q0, q1, ln)
          throw new Error('orthogami: something went wrong calculating edge curvature')
        }

        console.log('unfold edge:', q, q0, q1, ln)

        //Check normal for next facet
        var ln = unitDiff(q0, q1)
        if(Math.abs(ln[0]) + Math.abs(ln[1]) + Math.abs(ln[2]) !== 1) {
          q1 = neighbor[(q-2+neighbor.length) % neighbor.length]
          q0 = neighbor[(q-1+neighbor.length) % neighbor.length]
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

          var nbounds = computeBounds(nfacet)
          var outOfBounds = false
          for(var l=0; l<2; ++l) {
            nbounds[0][l] = Math.min(bounds[0][l], nbounds[0][l])
            nbounds[1][l] = Math.max(bounds[1][l], nbounds[1][l])
            if(nbounds[1][l] - nbounds[0][l] > boxSize[l]) {
              outOfBounds = true
            }
          }

          if(!outOfBounds && writeFacet(collisionMap, nfacet, [pb, pa])) {
            visited[nidx] = true
            toVisit.push(nidx)
            unfoldMap.push(Q)
            faceList.push(neighbor)
            mapList.push(Q)
            normalList.push(normals[nidx])
            clearEdge(a, b, P, Q, n, normals[nidx], cur, nidx)
            bounds = nbounds
          } else {
            console.log("write failed")
            pushEdge(a, b, P, cur, nidx)
          }
          break
        }
      }
    }

    console.log("unfolding done!")

    unfoldings.push({
      projections: mapList,
      faces: faceList,
      normals: normalList,
      tabs: edgeList,
      creases: creaseList
    })
  }

  return unfoldings
}