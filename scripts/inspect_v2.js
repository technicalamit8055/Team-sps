const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('public/receipt_base_v2.png');
const png = PNG.sync.read(data);

function getPixel(x, y) {
  const idx = (png.width * y + x) << 2;
  return [png.data[idx], png.data[idx+1], png.data[idx+2]];
}

console.log('Image dimensions:', png.width, 'x', png.height);

const yList = [450, 480, 510, 540, 570, 600, 630, 660, 690, 720, 750, 780, 810, 840, 870, 900, 950, 1000];
for (const y of yList) {
  console.log(`y = ${y}, x=500:`, getPixel(500, y));
}
