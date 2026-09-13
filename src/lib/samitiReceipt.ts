import type { SamitiDonation } from '@/types/samiti';

/**
 * Builds the official Samiti donation receipt text.
 *
 * Shared by the receipt modal, the wa.me deep link, and the one-tap direct
 * send in the data grid, so a donor gets identical wording on every path.
 * Also rides along as the caption on the PDF receipt sent via Baileys.
 */
export function buildSamitiReceiptMessage(
  donation: SamitiDonation,
  entity: { name: string; location?: string; tagline?: string },
  event: { title: string },
): string {
  const title = entity.location ? `${entity.name}, ${entity.location}` : entity.name;

  const balanceText =
    donation.balanceAmount === 0
      ? '✅ पूर्ण भुगतान (कोई बकाया नहीं)'
      : `⚠️ शेष बकाया राशि: ₹${donation.balanceAmount.toLocaleString('hi-IN')}`;

  const paymentModeText = donation.paymentMode === 'ONL' ? '📲 ऑनलाइन/UPI' : '💵 नकद/Cash';

  return `🚩 ${title} 🚩

📜 सहयोग रसीद

🔢 रसीद सं०: #${String(donation.serialNumber).padStart(4, '0')}
📅 दिनांक: ${donation.date || new Date().toISOString().split('T')[0]}
👤 सहयोगकर्ता: ${donation.name}

💰 स्वीकृत राशि: ₹${donation.acceptedAmount.toLocaleString('hi-IN')}
💵 प्राप्त राशि: ₹${donation.receivedAmount.toLocaleString('hi-IN')} (${paymentModeText})
${balanceText}

संग्रहकर्ता प्रतिनिधि: ${donation.collectorName || 'श्री दुर्गा पूजा समिति'}`;
}

/** Receipt payload fields derived from a donation, for the send API. */
export function toReceiptPayload(
  donation: SamitiDonation,
  entity: { name: string; location?: string; tagline?: string },
  event: { title: string },
) {
  return {
    customerName: donation.name,
    amount: donation.receivedAmount,
    receiptNo: String(donation.serialNumber).padStart(4, '0'),
    itemName: 'सहयोग / चंदा (Donation)',
    date: donation.date || new Date().toISOString().split('T')[0],
    businessName: entity.name,
    message: buildSamitiReceiptMessage(donation, entity, event),
  };
}
