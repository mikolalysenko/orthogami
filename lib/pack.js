var boxpack = require('boxpack')

module.exports = packSVGData

function packSVGData(sheets, boxSize, scale) {
  var pages = []
  while(sheets.length > 0) {

    var nextSheets = []
    var packed = []
    var bin = boxpack({
      width: boxSize[0],
      height: boxSize[1]
    })

    var upperBound = [0,0]

    //Loop over all sheets, try packing into box
    for(var i=0; i<sheets.length; ++i) {
      var sheet = sheets[i]
      var bounds = sheet.bounds

      var loc = bin.pack({
        width: (bounds[1][0]-bounds[0][0]) + 2*scale[0],
        height: (bounds[1][1] - bounds[0][1]) + 2*scale[1]
      })

      if(!loc) {
        nextSheets.push(sheet)
        continue
      }

      var offset = [loc.x, loc.y]
      var shape = [loc.width, loc.height]
      for(var j=0; j<2; ++j) {
        upperBound[j] = Math.max(upperBound[j], offset[j] + shape[j])
        offset[j] += scale[j] - bounds[0][j]
      }
      packed.push({
        svg: sheet.svg,
        offset: offset
      })
    }

    if(packed.length === 0) {
      throw new Error('orthogami: error packing faces into page')
    }

    //Compute the size of the packed sheet
    var pageSize = boxSize.slice()
    for(var i=0; i<2; ++i) {
      if(boxSize[i] < Infinity) {
        pageSize[i] = boxSize[i]
      } else {
        pageSize[i] = upperBound[i]
      }
    }

    //Generate SVG for this page
    var svg = [ 
      '<svg xmlns="http://www.w3.org/2000/svg" ',
      'xmlns:xlink="http://www.w3.org/1999/xlink" ',
      'width="', pageSize[0], '" ',
      'height="', pageSize[1], '">'
    ]
    for(var i=0; i<packed.length; ++i) {
      var offset = packed[i].offset
      svg.push('<g transform="translate(', offset[0], ',', offset[1], ')">',
        packed[i].svg,
        '</g>')
    }
    svg.push('</svg>')
    pages.push(svg.join(''))

    sheets = nextSheets
  }
  return pages
}