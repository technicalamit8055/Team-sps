const sharp = require('sharp');

async function findExactBoxes() {
  const { data, info } = await sharp('public/receipt_base_v3.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const ch = info.channels;
  function getPixel(x, y) {
    const idx = (y * w + x) * ch;
    return [data[idx], data[idx+1], data[idx+2]];
  }

  // Check box in Left Pill:
  // Around x: 220..400, y: 720..760
  // Inside the box is white/brightest pixel in this window
  function scanBox(name, xMin, xMax, yMin, yMax) {
    // Find border by gradient / color delta
    let minBx = 9999, maxBx = -1, minBy = 9999, maxBy = -1;
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const [r, g, b] = getPixel(x, y);
        // The inside of the input box is bright white/cream (r>252, g>250, b>240)
        // while the background outside the input box is warmer/darker
        if (r >= 253 && g >= 250 && b >= 244) {
          if (x < minBx) minBx = x;
          if (x > maxBx) maxBx = x;
          if (y < minBy) minBy = y;
          if (y > maxBy) maxBy = y;
        }
      }
    }
    console.log(name, {
      box: [minBx, minBy, maxBx, maxBy],
      width: maxBx - minBx + 1,
      height: maxBy - minBy + 1,
      center: [Math.round((minBx + maxBx)/2), Math.round((minBy + maxBy)/2)]
    });
  }

  console.log('--- Scanning exact inner input boxes ---');
  scanBox('1. Left Pill (Receipt No)', 220, 395, 720, 765);
  scanBox('2. Right Pill (Date)', 750, 930, 720, 765);
  scanBox('3. Donor Name Box', 350, 930, 815, 875);
  scanBox('4. Card 1 (Accepted Amt)', 170, 350, 930, 990);
  scanBox('5. Card 2 (Received Amt)', 450, 640, 930, 990);
  scanBox('6. Card 3 (Bakaya Amt)', 730, 920, 930, 990);
  scanBox('7. Bottom Left (Payment Mode)', 280, 480, 1030, 1075);
  scanBox('8. Bottom Right (Collector)', 710, 920, 1030, 1075);
}
findExactBoxes();
