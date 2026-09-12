import type { SamitiDonation } from '@/types/samiti';

/**
 * Builds the official Samiti donation receipt text.
 *
 * Shared by the receipt modal, the wa.me deep link, and the one-tap direct
 * send in the data grid, so a donor gets identical wording on every path.
 */
export function buildSamitiReceiptMessage(
  donation: SamitiDonation,
  entity: { name: string; location?: string; tagline?: string },
  event: { title: string },
): string {
  const balanceText =
    donation.balanceAmount === 0
      ? '✅ पूर्ण भुगतान (कोई बकाया नहीं)'
      : `⚠️ शेष बकाया राशि: ₹${donation.balanceAmount.toLocaleString('hi-IN')}`;

  const locationLine = entity.location ? `📍 ${entity.location}\n` : '';

  return `🚩 *${entity.name}* 🚩
${locationLine}🎉 ${event.title}
===========================
📜 *डिजिटल चंदा / सहयोग रसीद (Official Receipt)*
===========================
🔢 *रसीद सं० (Receipt No):* #${String(donation.serialNumber).padStart(4, '0')}
📅 *दिनांक (Date):* ${donation.date || new Date().toISOString().split('T')[0]}
👤 *सहयोगकर्ता (Donor):* ${donation.name}

💰 *स्वीकृत राशि (Pledged):* ₹${donation.acceptedAmount.toLocaleString('hi-IN')}
💵 *प्राप्त राशि (Received):* ₹${donation.receivedAmount.toLocaleString('hi-IN')} (${donation.paymentMode === 'ONL' ? '📲 ऑनलाइन/UPI' : '💵 नकद/Cash'})
${balanceText}

संग्रहकर्ता प्रतिनिधि: ${donation.collectorName || 'श्री दुर्गा पूजा समिति'}
===========================
🙏 *"${entity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।'}"*
===========================
🚩 माँ भगवती आपको सुख, शांति, समृद्धि व उत्तम स्वास्थ्य प्रदान करें! जय माँ दुर्गे! 🚩`;
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

