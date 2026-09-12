import { jsPDF } from 'jspdf';
import type { SamitiDonation } from '@/types/samiti';

const ONES: string[] = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाइस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

/**
 * Converts a positive number to natural Hindi currency words (e.g. "दो हजार एक सौ रुपये मात्र").
 */
export function numberToHindiWords(num: number): string {
  num = Math.floor(Math.abs(num));
  if (!num || isNaN(num) || num === 0) return 'शून्य रुपये मात्र';

  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (crore > 0) {
    result += (ONES[crore] || crore) + ' करोड़ ';
  }
  if (lakh > 0) {
    result += (ONES[lakh] || lakh) + ' लाख ';
  }
  if (thousand > 0) {
    result += (ONES[thousand] || thousand) + ' हजार ';
  }
  if (hundred > 0) {
    result += (ONES[hundred] || hundred) + ' सौ ';
  }
  if (remainder > 0) {
    result += (ONES[remainder] || remainder) + ' ';
  }

  return result.trim() + ' रुपये मात्र';
}

const FRESH_BG_URL = '/receipt_fresh_bg.jpg';
const CANVAS_WIDTH = 896;
const CANVAS_HEIGHT = 1200;

let cachedImage: HTMLImageElement | null = null;

function loadFreshBackground(): Promise<HTMLImageElement> {
  if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
    return Promise.resolve(cachedImage);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedImage = img;
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('रसीद बैकग्राउंड छवि लोड नहीं हो सकी।'));
    };
    img.src = FRESH_BG_URL;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates an HTMLCanvasElement with the brand-new, fresh divine template and all requested fields.
 */
export async function generateReceiptCanvas(
  donation: SamitiDonation,
  entity?: { name?: string; location?: string; tagline?: string },
  event?: { title?: string },
): Promise<HTMLCanvasElement> {
  const bg = await loadFreshBackground();

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported.');

  // 1. Draw pristine fresh divine background (Maa Durga, Golden Arch, Bells, Floral Mandala, Golden Diya)
  ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const centerX = CANVAS_WIDTH / 2; // 448

  // 2. Sacred Invocations under the Mandir Arch
  ctx.save();
  ctx.font = 'bold 15px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#b45309'; // Amber-700
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('॥ या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता नमस्तस्यै नमस्तस्यै नमो नमः ॥', centerX, 442);
  ctx.restore();

  // 3. Official Samiti / Entity Name
  const entityName = entity?.name || 'श्री दुर्गा पूजा समिति';
  ctx.save();
  ctx.font = '900 32px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#831843'; // Deep Royal Crimson / Maroon
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(entityName, centerX, 476);
  ctx.restore();

  // 4. Festival Title Ribbon
  const festivalTitle = event?.title || 'दुर्गा पूजा महोत्सव 2026';
  ctx.save();
  ctx.font = 'bold 19px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#991b1b'; // Red-800
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🚩 ${festivalTitle} 🚩`, centerX, 510);
  ctx.restore();

  // 5. Official Receipt Badge (Crimson banner with gold trim)
  ctx.save();
  roundRect(ctx, centerX - 180, 528, 360, 32, 16);
  const badgeGrad = ctx.createLinearGradient(centerX - 180, 528, centerX + 180, 560);
  badgeGrad.addColorStop(0, '#991b1b');
  badgeGrad.addColorStop(0.5, '#b91c1c');
  badgeGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#fef08a';
  ctx.stroke();

  ctx.font = 'bold 15px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('चंदा / सहयोग पावती • Donation Receipt', centerX, 544);
  ctx.restore();

  // 6. Meta Row: Receipt Number & Date
  const serialNo = `#${String(donation.serialNumber).padStart(4, '0')}`;
  const dateStr = donation.date || new Date().toISOString().split('T')[0];

  // Left Meta Pill: Receipt No
  ctx.save();
  roundRect(ctx, 100, 574, 335, 38, 12);
  ctx.fillStyle = 'rgba(255, 251, 235, 0.9)'; // amber-50
  ctx.fill();
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 14px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#78350f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('रसीद सं० (Receipt No):', 115, 593);

  ctx.font = '900 18px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#dc2626'; // Red
  ctx.textAlign = 'right';
  ctx.fillText(serialNo, 420, 593);
  ctx.restore();

  // Right Meta Pill: Date
  ctx.save();
  roundRect(ctx, 461, 574, 335, 38, 12);
  ctx.fillStyle = 'rgba(255, 251, 235, 0.9)';
  ctx.fill();
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 14px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#78350f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('दिनांक (Date):', 476, 593);

  ctx.font = 'bold 16px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, 781, 593);
  ctx.restore();

  // 7. Donor Information Card
  ctx.save();
  roundRect(ctx, 100, 624, 696, 72, 14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b'; // slate-500
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('सहयोगकर्ता का नाम (Donor Name):', 120, 634);

  ctx.font = '900 22px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillText(donation.name, 120, 654);

  if (donation.identity) {
    ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`🏢 पहचान / फर्म: ${donation.identity}`, 120, 678);
  }
  ctx.restore();

  // 8. THREE FINANCIAL CARDS: Accepted, Received, Bakaya (Exact user request!)
  const accepted = donation.acceptedAmount || donation.receivedAmount;
  const received = donation.receivedAmount;
  const balance = donation.balanceAmount ?? Math.max(0, accepted - received);

  const cardW = 222;
  const cardH = 112;
  const cardY = 708;

  // Card 1: स्वीकृत राशि (Accepted Amount)
  ctx.save();
  roundRect(ctx, 100, cardY, cardW, cardH, 14);
  ctx.fillStyle = '#fffbeb'; // amber-50
  ctx.fill();
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#92400e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('स्वीकृत राशि (Accepted)', 114, cardY + 12);

  ctx.font = '900 26px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`₹${accepted.toLocaleString('hi-IN')}`, 114, cardY + 38);

  ctx.font = '500 11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#78350f';
  ctx.fillText('कुल सहयोग संकल्प', 114, cardY + 78);
  ctx.restore();

  // Card 2: प्राप्त राशि (Received Amount) - Center Hero Card
  ctx.save();
  roundRect(ctx, 337, cardY, cardW, cardH, 14);
  ctx.fillStyle = '#ecfdf5'; // emerald-50
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 14px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#065f46';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('प्राप्त राशि (Received) ✅', 351, cardY + 10);

  ctx.font = '900 28px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#047857'; // Emerald
  ctx.fillText(`₹${received.toLocaleString('hi-IN')}`, 351, cardY + 34);

  // Hindi words
  const words = `(${numberToHindiWords(received)})`;
  ctx.font = 'bold 11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#065f46';
  ctx.fillText(words, 351, cardY + 76);
  ctx.restore();

  // Card 3: शेष बकाया (Bakaya / Balance Due)
  ctx.save();
  roundRect(ctx, 574, cardY, cardW, cardH, 14);
  ctx.fillStyle = balance > 0 ? '#fff1f2' : '#f8fafc'; // rose-50 or slate-50
  ctx.fill();
  ctx.strokeStyle = balance > 0 ? '#fca5a5' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = balance > 0 ? '#9f1239' : '#475569';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('शेष बकाया (Bakaya)', 588, cardY + 12);

  if (balance > 0) {
    ctx.font = '900 26px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#dc2626'; // Crimson red
    ctx.fillText(`₹${balance.toLocaleString('hi-IN')}`, 588, cardY + 38);

    ctx.font = 'bold 11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('⚠️ शेष बकाया देय', 588, cardY + 78);
  } else {
    ctx.font = '900 22px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#16a34a'; // Green
    ctx.fillText('₹0 (पूर्ण चुकता)', 588, cardY + 40);

    ctx.font = 'bold 11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#15803d';
    ctx.fillText('✅ कोई बकाया नहीं', 588, cardY + 78);
  }
  ctx.restore();

  // 9. Payment Mode Row
  const modeText = donation.paymentMode === 'ONL' ? '📲 ऑनलाइन (UPI / QR / Bank)' : '💵 नकद (Cash)';
  ctx.save();
  ctx.font = 'bold 14px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#78350f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`भुगतान माध्यम (Payment Mode):  ${modeText}`, centerX, 840);
  ctx.restore();

  // 10. Devotional Quote
  const quote = entity?.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।';
  ctx.save();
  ctx.font = 'italic 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#92400e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`“${quote}”`, centerX, 874);
  ctx.restore();

  // 11. Signatures Row
  ctx.save();
  // Left: Collector
  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.fillText(donation.collectorName || 'समिति प्रतिनिधि', 120, 920);
  ctx.font = '11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('संग्रहकर्ता हस्ताक्षर', 120, 938);

  // Right: Treasurer / Committee
  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'right';
  ctx.fillText('कोषाध्यक्ष / सचिव', 776, 920);
  ctx.font = '11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(entityName, 776, 938);
  ctx.restore();

  // 12. Bottom Devotional Banner (over the radiant Diya base)
  ctx.save();
  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#b45309';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚩 जय माता दी • सर्वे भवन्तु सुखिनः • सर्वे सन्तु निरामयाः 🚩', centerX, 1148);
  ctx.restore();

  return canvas;
}

/**
 * Returns a high-res PNG data URL of the freshly rendered festive receipt.
 */
export async function generateReceiptImageDataUrl(
  donation: SamitiDonation,
  entity?: { name?: string; location?: string; tagline?: string },
  event?: { title?: string },
): Promise<string> {
  const canvas = await generateReceiptCanvas(donation, entity, event);
  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Generates an official A4 portrait PDF of the festive donation receipt.
 * Returns the PDF as a base64 Data URL (`data:application/pdf;base64,...`).
 */
export async function generateReceiptPdfDataUrl(
  donation: SamitiDonation,
  entity?: { name?: string; location?: string; tagline?: string },
  event?: { title?: string },
): Promise<string> {
  const imgData = await generateReceiptImageDataUrl(donation, entity, event);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

  return pdf.output('datauristring');
}

/**
 * Downloads the PDF directly to the user's computer or device.
 */
export async function downloadReceiptPdf(
  donation: SamitiDonation,
  entity?: { name?: string; location?: string; tagline?: string },
  event?: { title?: string },
): Promise<void> {
  const pdfDataUrl = await generateReceiptPdfDataUrl(donation, entity, event);
  const serialNo = String(donation.serialNumber).padStart(4, '0');
  const safeName = (donation.name || 'donor').replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_');
  const filename = `receipt-${serialNo}-${safeName}.pdf`;

  const link = document.createElement('a');
  link.href = pdfDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads the PNG image directly to the user's computer or device.
 */
export async function downloadReceiptImage(
  donation: SamitiDonation,
  entity?: { name?: string; location?: string; tagline?: string },
  event?: { title?: string },
): Promise<void> {
  const imgDataUrl = await generateReceiptImageDataUrl(donation, entity, event);
  const serialNo = String(donation.serialNumber).padStart(4, '0');
  const safeName = (donation.name || 'donor').replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_');
  const filename = `receipt-${serialNo}-${safeName}.png`;

  const link = document.createElement('a');
  link.href = imgDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
