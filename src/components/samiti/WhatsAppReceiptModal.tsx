import React, { useState } from 'react';
import { SamitiDonation, DONATION_CATEGORIES } from '@/types/samiti';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Printer, Copy, Check, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppReceiptModalProps {
  donation: SamitiDonation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppReceiptModal: React.FC<WhatsAppReceiptModalProps> = ({
  donation,
  isOpen,
  onClose,
}) => {
  const { currentEntity, currentEvent } = useSamiti();
  const [copied, setCopied] = useState(false);
  const [overridePhone, setOverridePhone] = useState('');

  if (!donation) return null;

  const targetPhone = overridePhone || donation.phone || '';
  const categoryInfo = DONATION_CATEGORIES[donation.category] || DONATION_CATEGORIES.OTH;

  // Generate clean WhatsApp message
  const generateWhatsAppMessage = () => {
    const isFullPaid = donation.balanceAmount === 0;
    const balanceText = isFullPaid
      ? '✅ पूर्ण भुगतान (कोई बकाया नहीं)'
      : `⚠️ शेष बकाया राशि: ₹${donation.balanceAmount.toLocaleString('hi-IN')}`;

    return `🚩 *${currentEntity.name}* 🚩
📍 ${currentEntity.location || 'नारायणपुर'}
${currentEvent.title}
===========================
*डिजिटल चंदा / सहयोग रसीद*
===========================
📜 *रसीद सं०:* #${String(donation.serialNumber).padStart(3, '0')}
📅 *दिनांक:* ${donation.date || new Date().toLocaleDateString('hi-IN')}
👤 *सहयोगकर्ता:* ${donation.name}
🏷️ *श्रेणी:* ${categoryInfo.labelHi}
🏢 *पहचान/फर्म:* ${donation.identity || 'निवासी'}
📍 *पता:* ${donation.address1 || ''} ${donation.address2 ? ', ' + donation.address2 : ''}

💰 *स्वीकृत राशि (Pledged):* ₹${donation.acceptedAmount.toLocaleString('hi-IN')}
💵 *प्राप्त राशि (Received):* ₹${donation.receivedAmount.toLocaleString('hi-IN')} (${donation.paymentMode === 'ONL' ? 'ऑनलाइन/UPI' : 'नकद'})
${balanceText}

संग्रहकर्ता: ${donation.collectorName || 'समिति प्रतिनिधि'}
===========================
🙏 *${currentEntity.tagline || 'माँ भगवती की कृपा आप पर सदा बनी रहे।'}*
धन्यवाद!`;
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('कृपया मान्य 10 अंकों का व्हाट्सएप मोबाइल नंबर दर्ज करें!');
      return;
    }

    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(generateWhatsAppMessage());
    const url = `https://wa.me/${phoneWithCountry}?text=${message}`;

    window.open(url, '_blank');
    toast.success('व्हाट्सएप रसीद संदेश भेजा जा रहा है...');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setCopied(true);
    toast.success('रसीद का टेक्स्ट कॉपी हो गया!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[94vw] p-0 overflow-hidden bg-white border-amber-300 rounded-2xl">
        <DialogHeader className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
            डिजिटल चंदा रसीद (Official Receipt)
          </DialogTitle>
        </DialogHeader>

        {/* Printable & Screen Receipt Card */}
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:p-8" id="printable-receipt">
          {/* Ornate Hindu / Festival Border Container */}
          <div className="relative border-4 border-double border-amber-500/80 rounded-xl p-3.5 sm:p-5 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 shadow-inner">
            {/* Corner Decorative Glyphs */}
            <div className="absolute top-1 left-2 text-amber-600/70 text-xs font-serif">🚩 ॐ</div>
            <div className="absolute top-1 right-2 text-amber-600/70 text-xs font-serif">卐 🚩</div>

            {/* Letterhead Header */}
            <div className="text-center border-b-2 border-amber-400 pb-3">
              <h2 className="text-xl font-extrabold text-amber-950 tracking-wide font-serif">
                {currentEntity.name}
              </h2>
              <p className="text-xs text-amber-900 font-medium">
                📍 {currentEntity.location || 'नारायणपुर'} • स्थापना वर्ष: {currentEntity.establishedYear || 1985}
              </p>
              <p className="text-xs font-semibold text-orange-700 mt-0.5">
                {currentEvent.title}
              </p>
              <div className="mt-2 inline-block bg-amber-600 text-white font-bold text-[11px] px-3 py-0.5 rounded-full shadow-sm">
                सहयोग / चंदा पावती (Donation Receipt)
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="flex justify-between items-center text-xs mt-3 px-1 py-1 bg-amber-100/50 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 font-mono">
                क्रमांक / S.No: #{String(donation.serialNumber).padStart(3, '0')}
              </span>
              <span className="text-amber-900">
                दिनांक: <span className="font-semibold">{donation.date}</span>
              </span>
            </div>

            {/* Contributor Details */}
            <div className="mt-3 space-y-2 text-xs border-b border-amber-200 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-[11px]">सहयोगकर्ता का नाम (Donor Name):</p>
                  <p className="text-base font-bold text-gray-950">{donation.name}</p>
                </div>
                <Badge className={categoryInfo.badgeColor}>{categoryInfo.labelHi}</Badge>
              </div>

              {donation.identity && (
                <div>
                  <p className="text-gray-500 text-[11px]">पहचान / दुकान / पिता (Identity / Firm):</p>
                  <p className="font-semibold text-gray-800">{donation.identity}</p>
                </div>
              )}

              {(donation.address1 || donation.address2) && (
                <div>
                  <p className="text-gray-500 text-[11px]">पता (Address):</p>
                  <p className="text-gray-700">
                    {donation.address1} {donation.address2 ? `• ${donation.address2}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Amount Table */}
            <div className="mt-3 bg-amber-50/70 rounded-lg p-3 border border-amber-300">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">स्वीकृत राशि (Accepted):</span>
                  <p className="text-sm font-bold text-gray-900">₹{donation.acceptedAmount.toLocaleString('hi-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-500">भुगतान माध्यम (Mode):</span>
                  <p className="text-sm font-bold text-amber-800">
                    {donation.paymentMode === 'ONL' ? '📲 ऑनलाइन (UPI / QR)' : '💵 नकद (Cash)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-amber-200">
                <div className="bg-emerald-50 p-2 rounded border border-emerald-300">
                  <span className="text-emerald-700 font-semibold">प्राप्त राशि (Received):</span>
                  <p className="text-base font-black text-emerald-800">
                    ₹{donation.receivedAmount.toLocaleString('hi-IN')}
                  </p>
                </div>
                <div className={`p-2 rounded border ${donation.balanceAmount > 0 ? 'bg-red-50 border-red-300 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <span className="font-semibold">शेष बकाया (Balance Due):</span>
                  <p className="text-base font-black">
                    ₹{donation.balanceAmount.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Blessing & Signatures */}
            <div className="mt-4 text-center">
              <p className="text-[11px] font-serif italic text-amber-900 font-medium">
                "{currentEntity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।'}"
              </p>
              <div className="flex justify-between items-end mt-6 text-[10px] text-gray-500 px-2">
                <div className="text-left">
                  <p className="font-semibold text-gray-700">{donation.collectorName || 'अधिकृत कार्यकर्ता'}</p>
                  <p>संग्रहकर्ता हस्ताक्षर</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-950 font-serif">कोषाध्यक्ष / सचिव</p>
                  <p>श्री दुर्गा पूजा समिति</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Phone override */}
          <div className="bg-gray-50 p-3 rounded-lg border flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>व्हाट्सएप मोबाइल नंबर (WhatsApp Number):</span>
              <span className="text-[11px] text-muted-foreground">10 अंक</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="उदा० 9835012345"
                defaultValue={donation.phone}
                value={overridePhone}
                onChange={e => setOverridePhone(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 sm:flex-none h-9 text-xs border-slate-200 text-slate-700 hover:bg-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'कॉपी हो गया' : 'टेक्स्ट कॉपी'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none h-9 text-xs border-slate-200 text-slate-700 hover:bg-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              प्रिंट रसीद
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto h-10 sm:h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            <MessageSquare className="w-4 h-4 mr-1.5 fill-current" />
            व्हाट्सएप पर भेजें (Send Receipt)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
