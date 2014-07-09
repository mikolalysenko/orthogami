module.exports = project

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