const sharp = require('sharp');

async function testRenderV3() {
  const serialNo = '#0001';
  const dateStr = '2026-09-11';
  const name = 'सुरेश कुमार अग्रवाल';
  const accepted = '₹2,100';
  const acceptedWords = '(दो हजार एक सौ रुपये मात्र)';
  const received = '₹2,100';
  const receivedWords = '(दो हजार एक सौ रुपये मात्र)';
  const balance = '₹0';
  const balanceWords = '(शून्य रुपये)';
  const modeText = 'नकद (Cash)';
  const collectorText = 'सुनील वर्मा';

  const svg = `
  <svg width="1084" height="1451" viewBox="0 0 1084 1451" xmlns="http://www.w3.org/2000/svg">
    <style>
      .red-num { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 26px; fill: #dc2626; text-anchor: middle; dominant-baseline: central; }
      .date-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 24px; fill: #1c1917; text-anchor: middle; dominant-baseline: central; }
      .donor-name { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #0f172a; text-anchor: middle; dominant-baseline: central; }
      .amt-slate { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #0f172a; text-anchor: middle; dominant-baseline: central; }
      .amt-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #047857; text-anchor: middle; dominant-baseline: central; }
      .amt-zero { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #16a34a; text-anchor: middle; dominant-baseline: central; }
      .words-amber { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #92400e; text-anchor: middle; dominant-baseline: central; }
      .words-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #065f46; text-anchor: middle; dominant-baseline: central; }
      .words-zero { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #15803d; text-anchor: middle; dominant-baseline: central; }
      .mode-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 20px; fill: #78350f; text-anchor: middle; dominant-baseline: central; }
      .collector-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 20px; fill: #78350f; text-anchor: middle; dominant-baseline: central; }
    </style>
    <!-- Receipt serial inside Left Box (Center: 309, 742) -->
    <text x="309" y="742" class="red-num">${serialNo}</text>
    <!-- Date inside Right Box (Center: 840, 742) -->
    <text x="840" y="742" class="date-txt">${dateStr}</text>
    <!-- Donor inside Donor Box (Center: 650, 822) -->
    <text x="650" y="822" class="donor-name">${name}</text>
    <!-- Card 1 Amount inside box (Center: 258, 956) -->
    <text x="258" y="956" class="amt-slate">${accepted}</text>
    <!-- Card 2 Amount inside box (Center: 563, 956) -->
    <text x="563" y="956" class="amt-green">${received}</text>
    <!-- Card 3 Amount inside box (Center: 868, 956) -->
    <text x="868" y="956" class="amt-zero">${balance}</text>
    <!-- Bottom Left: Payment Mode inside box (Center: 381, 1049) -->
    <text x="381" y="1049" class="mode-txt">${modeText}</text>
    <!-- Bottom Right: Collector inside box (Center: 800, 1049) -->
    <text x="800" y="1049" class="collector-txt">${collectorText}</text>
  </svg>
  `;

  await sharp('public/receipt_base_v3.png')
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile('public/receipt_preview_v3_test.png');

  console.log('Successfully created public/receipt_preview_v3_test.png');
}
testRenderV3();
