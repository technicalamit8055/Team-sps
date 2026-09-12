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

const TEMPLATE_URL = '/receipt_template_clean.png';
const CANVAS_WIDTH = 1055;
const CANVAS_HEIGHT = 1491;

let cachedImage: HTMLImageElement | null = null;

function loadTemplateImage(): Promise<HTMLImageElement> {
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
      reject(new Error('रसीद टेम्पलेट छवि लोड नहीं हो सकी।'));
    };
    img.src = TEMPLATE_URL;
  });
}

/**
 * Generates an HTMLCanvasElement with the festive template and rendered donation data.
 */
export async function generateReceiptCanvas(
  donation: SamitiDonation,
  _entity?: { name?: string; location?: string; tagline?: string },
  _event?: { title?: string },
): Promise<HTMLCanvasElement> {
  const template = await loadTemplateImage();

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported.');

  // 1. Draw festive base artwork
  ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Serial Number inside Left Pill Box (x: 250..385, y: 660..712)
  const receiptNo = `#${String(donation.serialNumber).padStart(4, '0')}`;
  ctx.save();
  ctx.font = 'bold 30px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#b91c1c'; // Crimson red
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(receiptNo, (250 + 385) / 2, (660 + 712) / 2);
  ctx.restore();

  // 3. Date inside Right Pill Box (x: 766..917, y: 660..712)
  const dateStr = donation.date || new Date().toISOString().split('T')[0];
  ctx.save();
  ctx.font = 'bold 25px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1c1917'; // Slate/stone 900
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dateStr, (766 + 917) / 2, (660 + 712) / 2);
  ctx.restore();

  // 4. Donor Name & Optional Identity (x: 245, y: 836)
  ctx.save();
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (donation.identity) {
    // If identity exists, show donor name slightly higher and identity below
    ctx.font = 'bold 34px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillText(donation.name, 245, 825);

    ctx.font = '600 21px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569'; // slate-600
    ctx.fillText(`🏢 ${donation.identity}`, 245, 853);
  } else {
    ctx.font = 'bold 38px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillText(donation.name, 245, 838);
  }
  ctx.restore();

  // 5. Received Amount in Green Box (x: 242, y: 980)
  ctx.save();
  ctx.font = '900 48px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#047857'; // emerald-700
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`₹${donation.receivedAmount.toLocaleString('hi-IN')}`, 242, 980);
  ctx.restore();

  // 6. Amount in Words in Hindi (x: 242, y: 1022)
  const words = `(${numberToHindiWords(donation.receivedAmount)})`;
  ctx.save();
  ctx.font = 'bold 20px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#15803d'; // emerald-800
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(words, 242, 1022);
  ctx.restore();

  // 7. Payment Mode in Warm Cream Box (x: 702, y: 994)
  const modeText = donation.paymentMode === 'ONL' ? 'ऑनलाइन (UPI/QR)' : 'नकद (Cash)';
  ctx.save();
  ctx.font = 'bold 31px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1e293b'; // slate-800
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(modeText, 702, 994);
  ctx.restore();

  return canvas;
}

/**
 * Returns a high-res PNG data URL of the rendered festive receipt.
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

  // A4 Portrait standard proportions: 210 x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fill the entire page with the high-resolution festive border & receipt artwork
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
