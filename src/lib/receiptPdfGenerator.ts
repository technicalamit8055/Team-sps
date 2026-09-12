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
  if (!num || isNaN(num) || num === 0) return 'शून्य रुपये';

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

const TEMPLATE_URL = '/receipt_clean_v2.png';
const CANVAS_WIDTH = 1084;
const CANVAS_HEIGHT = 1451;

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
 * Generates an HTMLCanvasElement with the user's custom festive receipt and pixel-perfect alignment.
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

  // 1. Draw base high-resolution festive template
  ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Receipt Number inside Left Meta Pill (Centered in number slot at x = 310, baseline y = 749)
  const serialNo = `#${String(donation.serialNumber).padStart(4, '0')}`;
  ctx.save();
  ctx.font = '900 28px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#dc2626'; // Vivid red
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(serialNo, 310, 749);
  ctx.restore();

  // 3. Date inside Right Meta Pill (Centered in date slot at x = 850, baseline y = 749)
  const dateStr = donation.date || new Date().toISOString().split('T')[0];
  ctx.save();
  ctx.font = 'bold 24px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#1c1917'; // Rich slate dark
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(dateStr, 850, 749);
  ctx.restore();

  // 4. Donor Information (Label 'सहयोगकर्ता का नाम:' is already crisp in template)
  ctx.save();
  ctx.font = '900 30px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a'; // Slate-950
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(donation.name, 190, 852);
  ctx.restore();

  // 5. THE THREE FINANCIAL CARDS (Strict Pixel-Perfect Alignment across all 3 cards)
  // Labels 'स्वीकृत राशि:', 'प्राप्त राशि:', 'शेष राशि:' and all 3 icons are already crisp in template!
  const accepted = donation.acceptedAmount || donation.receivedAmount;
  const received = donation.receivedAmount;
  const balance = donation.balanceAmount ?? Math.max(0, accepted - received);

  // Common Baselines for all 3 cards
  const amountY = 960;
  const wordsY = 994;

  // --- CARD 1: स्वीकृत राशि (Accepted Amount, X = 190) ---
  ctx.save();
  ctx.font = '900 32px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a'; // Slate-900
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`₹${accepted.toLocaleString('hi-IN')}`, 190, amountY);

  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#92400e'; // Amber-800
  ctx.fillText(`(${numberToHindiWords(accepted)})`, 190, wordsY);
  ctx.restore();

  // --- CARD 2: प्राप्त राशि (Received Amount, X = 495) ---
  ctx.save();
  ctx.font = '900 32px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#047857'; // Emerald-700
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`₹${received.toLocaleString('hi-IN')}`, 495, amountY);

  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#065f46'; // Emerald-800
  ctx.fillText(`(${numberToHindiWords(received)})`, 495, wordsY);
  ctx.restore();

  // --- CARD 3: शेष राशि (Bakaya / Balance Due, X = 800) ---
  ctx.save();
  ctx.font = '900 32px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = balance > 0 ? '#dc2626' : '#16a34a'; // Red if due, Green if 0
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`₹${balance.toLocaleString('hi-IN')}`, 800, amountY);

  const balanceWords = balance === 0 ? '(शून्य रुपये)' : `(${numberToHindiWords(balance)})`;
  ctx.font = 'bold 13px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = balance > 0 ? '#b91c1c' : '#15803d';
  ctx.fillText(balanceWords, 800, wordsY);
  ctx.restore();

  // 6. Payment Mode (Beside the pristine Cash note icon, starting at X = 318)
  const modeText = donation.paymentMode === 'ONL' ? 'ऑनलाइन (UPI/QR)' : 'नकद (Cash)';
  ctx.save();
  ctx.font = '900 23px "Noto Sans Devanagari", "Segoe UI", sans-serif';
  ctx.fillStyle = '#78350f'; // Amber-900
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(modeText, 318, 1056);
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
