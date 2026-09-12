const sharp = require('sharp');

async function testRender() {
  const serialNo = '#0001';
  const dateStr = '2026-09-11';
  const name = '88u8u';
  const accepted = '₹2,100';
  const acceptedWords = '(दो हजार एक सौ रुपये मात्र)';
  const received = '₹2,100';
  const receivedWords = '(दो हजार एक सौ रुपये मात्र)';
  const balance = '₹0';
  const balanceWords = '(शून्य रुपये)';
  const modeText = 'नकद (Cash)';

  const svg = `
  <svg width="1084" height="1451" viewBox="0 0 1084 1451" xmlns="http://www.w3.org/2000/svg">
    <style>
      .red-num { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #dc2626; text-anchor: middle; }
      .date-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 24px; fill: #1c1917; text-anchor: middle; }
      .donor-name { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 30px; fill: #0f172a; text-anchor: start; }
      .amt-slate { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #0f172a; text-anchor: start; }
      .amt-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #047857; text-anchor: start; }
      .amt-zero { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #16a34a; text-anchor: start; }
      .words-amber { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #92400e; text-anchor: start; }
      .words-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #065f46; text-anchor: start; }
      .words-zero { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #15803d; text-anchor: start; }
      .mode-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 23px; fill: #78350f; text-anchor: start; }
    </style>
    <text x="310" y="749" class="red-num">${serialNo}</text>
    <text x="850" y="749" class="date-txt">${dateStr}</text>
    <text x="190" y="852" class="donor-name">${name}</text>
    <text x="190" y="960" class="amt-slate">${accepted}</text>
    <text x="190" y="994" class="words-amber">${acceptedWords}</text>
    <text x="495" y="960" class="amt-green">${received}</text>
    <text x="495" y="994" class="words-green">${receivedWords}</text>
    <text x="800" y="960" class="amt-zero">${balance}</text>
    <text x="800" y="994" class="words-zero">${balanceWords}</text>
    <text x="318" y="1056" class="mode-txt">${modeText}</text>
  </svg>
  `;

  await sharp('public/receipt_clean_v2.png')
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile('public/receipt_preview_test.png');

  console.log('Successfully created public/receipt_preview_test.png');
}

async function testBakaya() {
  const serialNo = '#0042';
  const dateStr = '2026-09-12';
  const name = 'सुरेश कुमार अग्रवाल';
  const accepted = '₹5,000';
  const acceptedWords = '(पाँच हजार रुपये मात्र)';
  const received = '₹3,000';
  const receivedWords = '(तीन हजार रुपये मात्र)';
  const balance = '₹2,000';
  const balanceWords = '(दो हजार रुपये मात्र)';
  const modeText = 'ऑनलाइन (UPI/QR)';

  const svg = `
  <svg width="1084" height="1451" viewBox="0 0 1084 1451" xmlns="http://www.w3.org/2000/svg">
    <style>
      .red-num { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 28px; fill: #dc2626; text-anchor: middle; }
      .date-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 24px; fill: #1c1917; text-anchor: middle; }
      .donor-name { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 30px; fill: #0f172a; text-anchor: start; }
      .amt-slate { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #0f172a; text-anchor: start; }
      .amt-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #047857; text-anchor: start; }
      .amt-due { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 32px; fill: #dc2626; text-anchor: start; }
      .words-amber { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #92400e; text-anchor: start; }
      .words-green { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #065f46; text-anchor: start; }
      .words-due { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: bold; font-size: 13px; fill: #b91c1c; text-anchor: start; }
      .mode-txt { font-family: "Noto Sans Devanagari", "Segoe UI", sans-serif; font-weight: 900; font-size: 23px; fill: #78350f; text-anchor: start; }
    </style>
    <text x="310" y="749" class="red-num">${serialNo}</text>
    <text x="850" y="749" class="date-txt">${dateStr}</text>
    <text x="190" y="852" class="donor-name">${name}</text>
    <text x="190" y="960" class="amt-slate">${accepted}</text>
    <text x="190" y="994" class="words-amber">${acceptedWords}</text>
    <text x="495" y="960" class="amt-green">${received}</text>
    <text x="495" y="994" class="words-green">${receivedWords}</text>
    <text x="800" y="960" class="amt-due">${balance}</text>
    <text x="800" y="994" class="words-due">${balanceWords}</text>
    <text x="318" y="1056" class="mode-txt">${modeText}</text>
  </svg>
  `;

  await sharp('public/receipt_clean_v2.png')
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile('public/receipt_preview_bakaya.png');

  console.log('Successfully created public/receipt_preview_bakaya.png');
}

async function run() {
  await testRender();
  await testBakaya();
}
run();
