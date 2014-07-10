'use strict'

var contour2D = require('contour-2d')
var createIntervalTree = require('interval-tree-1d')

var show = require('ndarray-show')

module.exports = contour

function Vertex(v, next, prev) {
  this.point = v
  this.next = next
  this.prev = prev
  this.visited = false
}

Vertex.prototype.clone = function() {
  return new Vertex(this.point.slice(), this.next, this.prev)
}

Vertex.prototype.compare = function(other) {
  for(var i=0; i<2; ++i) {
    var d = this.point[i] - other.point[i]
    if(d) {
      return d
    }
  }
  return d
}

function toList(loop) {
  var verts = new Array(loop.length)
  for(var i=0; i<loop.length; ++i) {
    verts[i] = new Vertex(loop[i], null, null)
  }

  var topLeftIndex = 0
  for(var i=0; i<loop.length; ++i) {
    verts[i].next = verts[(i+1) % loop.length]
    verts[i].prev = verts[(i-1+loop.length) % loop.length]
    if(verts[i].compare(verts[topLeftIndex]) < 0) {
      topLeftIndex = i
    }
  }

  if(topLeftIndex > 0) {
    var as = verts.slice(topLeftIndex)
    var bs = verts.slice(0, topLeftIndex)
    verts = as.concat(bs)
  }
  
  return verts
}

function deloop(verts) {
  for(var i=0; i<verts.length; ++i) {
    verts[i].visited = false
  }
  var loops = []
  for(var i=0; i<verts.length; ++i) {
    if(verts[i].visited) {
      continue
    }
    var loop = []
    for(var cur=verts[i]; !cur.visited; cur=cur.next) {
      loop.push(cur)
      cur.visited = true
    }
    loops.push(loop)
  }
  return loops
}

function curvature(a, b, c) {
  var ab = [a[0] - b[0], a[1] - b[1]]
  var cb = [c[0] - b[0], c[1] - b[1]]

  return ab[0]*cb[1] - ab[1]*cb[0]
}

function fixNonManifold(verts, normal) {
  var vertexMap = {}
  for(var i=0; i<verts.length; ++i) {
    var a = verts[i]
    var tok = a.point.join()
    var b = vertexMap[tok]
    if(!b) {
      vertexMap[tok] = a
      continue
    }

    //Check non-manifold crossing
    var a0 = a.prev.point
    var a1 = a.point
    var a2 = a.next.point
    var ac = curvature(a0, a1, a2)

    var b0 = b.prev.point
    var b1 = b.point
    var b2 = b.next.point
    var bc = curvature(b0, b1, b2)

    if(ac > 0 && bc > 0) {
      var an = a.next
      var bn = b.next
      an.prev = b
      an.prev = a
      a.next = bn
      b.next = an
    }
  }
}

function loopOrientation(loop) {
  var leftMostEdge = Infinity
  var orientation = 0
  for(var i=0; i<loop.length; ++i) {
    var a = loop[i].point
    var b = loop[(i+1) % loop.length].point
    if(a[0] === b[0]) {
      if(a[0] < leftMostEdge) {
        leftMostEdge = a[0]
        orientation = a[1] - b[1]
      }
    }
  }
  return orientation
}

function Segment(x0, x1, y, loop) {
  this[0] = x0
  this[1] = x1
  this.y = y
  this.loop = loop
}

function repairHoles(verts) {
  var loops = deloop(verts)

  var innerLoops = []
  var outerLoops = []
  loops.forEach(function(loop) {
    if(loopOrientation(loop) < 0) {
      innerLoops.push(loop)
    } else {
      outerLoops.push(loop)
    }
  })

  //For each horizontal segment in outer loop, build an edge
  var segments = []
  outerLoops.forEach(function(loop) {
    for(var i=0; i<loop.length; ++i) {
      var a = loop[i].point
      var b = loop[(i+1) % loop.length].point
      if(a[1] === b[1]) {
        if(a[0] > b[0]) {
          segments.push(new Segment(b[0], a[0], a[1], loop))
        }
      }
    }
  })

  //Build interval tree
  var tree = createIntervalTree(segments)

  innerLoops.forEach(function(loop) {
    //Find top vertex
    var topVertex = loop[0].point
    for(var i=1; i<loop.length; ++i) {
      var a = loop[i].point
      if(a[1] > topVertex[1]) {
        topVertex = a
      }
    }

    //Cast horizontal ray
    var hitTarget = null
    var hitY = Infinity
    tree.queryPoint(topVertex[0], function(seg) {
      if(seg.y < topVertex[1]) {
        return
      }
      if(seg.y < hitY) {
        hitY = seg.y
        hitTarget = seg.loop
      }
    })

    if(!hitTarget) {
      throw new Error("could not nest internal loop (this should not happen)")
    }

    //Glue nested loop
    var a = hitTarget[0]    
    var an = a.next
    var ap = a.prev
    var ac = a.clone()
    verts.push(ac)

    var b = loop[0]
    var bn = b.next
    var bp = b.prev
    var bc = b.clone()
    verts.push(bc)

    a.next = b
    b.prev = a

    ac.prev = bc
    bc.next = ac
    an.prev = ac
    bp.next = bc
  })

  return verts
}

function convertVertices(verts) {
  var loops = deloop(verts)
  var result = loops.map(function(loop) {
    return loop.map(function(v) {
      return v.point
    })
  })
  return result
}


function splitTJunction(loop, above) {
  var subdiv = []
  for(var i=0; i<loop.length; ++i) {
    var a = loop[i]
    var b = loop[(i+1) % loop.length]

    subdiv.push(a)

    var d = 0
    if(a[0] === b[0]) {
      d = 1
    }

    //Walk along edge, splitting t-junctions as we go
    var o = d^1
    var x = a.slice()
    
    //var parity = 2*d - 1
    var step
    var parity = !!o ? -1 : 1
    if(a[d] < b[d]) {
      if(d === 0) {
        x[o] -= 1
      }
      step = 1
    } else {
      if(d === 1) {
        x[o] -= 1
      }
      step = -1
    }

    for(var j=a[d]+step; j!==b[d]; j+=step) {
      x[d] = j
      var s = !!above.get(x[1], x[0])

      console.log(x, s)

      x[d] = j-1
      var t = !!above.get(x[1], x[0])

      console.log(x, t)

      if(s !== t) {
        var y = a.slice()
        y[d] = j
        console.log('splitting', y)
        subdiv.push(y)
      }
    }
  }

  return subdiv
}

function contour(slice, sliceTop) {

  console.log('plane:')
  console.log(show(slice))

  console.log('above:')
  console.log(show(sliceTop))  


  //Get coordinates of slice
  var coords = contour2D(slice, true)
  if(coords.length === 0) {
    return []
  }

  //Convert to linked list
  var verts = coords
    .map(function(loop) {
      return splitTJunction(loop, sliceTop)
    })
    .map(toList)
    .reduce(function(a,b) {
      return a.concat(b)
    }, [])


  //Remove non-manifold vertices
  fixNonManifold(verts)

  //Repair all holes
  repairHoles(verts)

  var result = convertVertices(verts)
  return result
}