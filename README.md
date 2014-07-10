orthogami
=========
Voxel origami generator.  Works in node.js and browserify

## Example usage

```javascript
//First create a voxel set
//  0 = empty
var voxels = require('ndarray-pack')([
  [[0, 1],
   [2, 3]],
  [[0, 0],
   [0, 4]]
])

//Require the module (works with browserify)
var orthogami = require('orthogami')

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
```

### Output

#### Page 1:

#### Page 2:


## Install

```
npm install orthogami
```

## API

### `require('orthogami')(voxels[, options])`

Generates an origami template for folding a model from the given voxel object.

* `voxels` is a 3D ndarray of integer values.  `0` values indicate empty voxels.
* `options` is an optional object containing any of the following extra parameters:

    + `colorMap` a function mapping color values in the voxels to SVG color names, or alternatively an array of SVG color names.
    + `bounds` a 2D array representing the size of each page (default `[Infinity, Infinity]`)
    + `scale` a number giving the size of each voxel (default `64`)
    + `convexColor` the color of the convex creases (default `'black'`)
    + `concaveColor` the color of the concave creases (default `'white'`)
    + `tabColor` the color of the tab lines (default `'black'`)
    + `lineWidth` the width of the crease lines (default `1`)

**Returns** An array of SVG files encoding the pages of the origami printout

# Credits
(c) 2014 Mikola Lysenko. MIT License