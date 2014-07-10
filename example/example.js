//First create a voxel set
//  0 = empty
var voxels = require('ndarray-pack')([
  [[0, 1],
   [2, 3]],
  [[0, 0],
   [0, 4]]
])

//Require the module (works with browserify)
var orthogami = require('../index')

//Set up options (can skip this if you like)
var options = {
  bounds: [300, 300],   //Page size
  scale: 50,            //Size of each voxel face
  colorMap: ['black', 'red', 'green', 'blue', 'yellow'], //Colors (can be a function)
  convexColor: 'magenta',   //Color for crease lines
  concaveColor: 'turqoise',
  lineWidth: 1   //Width for lines
}

//Then run orthogami
var svgs = orthogami(voxels, options)

//Print out the result
var fs = require('fs')
svgs.forEach(function(svg, idx) {
  fs.writeFileSync('page' + idx + '.svg', svg)
})