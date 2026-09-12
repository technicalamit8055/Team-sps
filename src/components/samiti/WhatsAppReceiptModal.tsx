import React, { useState, useEffect } from 'react';
import { SamitiDonation } from '@/types/samiti';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Printer,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Send,
  Loader2,
  Download,
  FileText,
  Eye,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsAppReceipt, toBase64Pdf } from '@/lib/whatsapp';
import { buildSamitiReceiptMessage } from '@/lib/samitiReceipt';
import {
  generateReceiptImageDataUrl,
  generateReceiptPdfDataUrl,
  downloadReceiptPdf,
  downloadReceiptImage,
} from '@/lib/receiptPdfGenerator';

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
  const [phoneInput, setPhoneInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'text'>('preview');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [attachPdf, setAttachPdf] = useState(true);

  // Seed phone input each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoneInput(donation?.phone || '');
    }
  }, [isOpen, donation?.id, donation?.phone]);

  // Generate live image preview whenever donation/modal changes
  useEffect(() => {
    let cancelled = false;
    if (isOpen && donation) {
      setGeneratingPreview(true);
      generateReceiptImageDataUrl(donation, currentEntity, currentEvent)
        .then((url) => {
          if (!cancelled) {
            setPreviewUrl(url);
            setGeneratingPreview(false);
          }
        })
        .catch((err) => {
          console.error('Failed to generate preview image:', err);
          if (!cancelled) setGeneratingPreview(false);
        });
    } else {
      setPreviewUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, donation, currentEntity, currentEvent]);

  if (!donation) return null;

  const targetPhone = phoneInput || donation.phone || '';

  const generateWhatsAppMessage = () =>
    buildSamitiReceiptMessage(donation, currentEntity, currentEvent);

  /**
   * Send automatically through Baileys. Attaches the festive PDF document when enabled.
   */
  const handleAutoSend = async () => {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('कृपया 10 अंकों का मान्य व्हाट्सएप मोबाइल नंबर दर्ज करें!');
      return;
    }

    setSending(true);
    try {
      let pdfBase64: string | undefined = undefined;
      if (attachPdf) {
        try {
          const pdfDataUrl = await generateReceiptPdfDataUrl(donation, currentEntity, currentEvent);
          pdfBase64 = toBase64Pdf(pdfDataUrl);
        } catch (pdfErr) {
          console.warn('PDF generation failed, falling back to text:', pdfErr);
        }
      }

      await sendWhatsAppReceipt({
        phone: cleanPhone,
        customerName: donation.name,
        amount: donation.receivedAmount,
        receiptNo: String(donation.serialNumber).padStart(4, '0'),
        itemName: 'सहयोग / चंदा (Donation)',
        date: donation.date || new Date().toISOString().split('T')[0],
        businessName: currentEntity.name,
        message: generateWhatsAppMessage(),
        pdfBuffer: pdfBase64,
      });

      toast.success(
        attachPdf
          ? `भव्य PDF रसीद ${donation.name} को व्हाट्सएप पर भेज दी गई! ✅`
          : `रसीद ${donation.name} को भेज दी गई! ✅`,
      );
    } catch (err) {
      toast.error((err as Error).message, {
        description: 'आप "व्हाट्सएप खोलें" से मैन्युअल भी भेज सकते हैं।',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('कृपया 10 अंकों का मान्य व्हाट्सएप मोबाइल नंबर दर्ज करें!');
      return;
    }

    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(generateWhatsAppMessage());
    const url = `https://wa.me/${phoneWithCountry}?text=${message}`;

    window.open(url, '_blank');
    toast.success('व्हाट्सएप रसीद संदेश भेजा जा रहा है...');
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadReceiptPdf(donation, currentEntity, currentEvent);
      toast.success('PDF रसीद डाउनलोड हो गई! 📄');
    } catch (err) {
      toast.error('PDF डाउनलोड करने में समस्या आई: ' + (err as Error).message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      await downloadReceiptImage(donation, currentEntity, currentEvent);
      toast.success('रसीद इमेज (PNG) डाउनलोड हो गई! 🖼️');
    } catch (err) {
      toast.error('इमेज डाउनलोड करने में समस्या आई: ' + (err as Error).message);
    }
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
      <DialogContent className="max-w-2xl w-[96vw] p-0 overflow-hidden bg-white border-amber-300 rounded-3xl shadow-2xl">
        {/* Header with gradient and view switcher */}
        <DialogHeader className="p-3 sm:p-4 bg-gradient-to-r from-rose-700 via-amber-600 to-orange-600 text-white flex flex-row items-center justify-between gap-2">
          <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>डिजिटल चंदा रसीद (Official Receipt)</span>
          </DialogTitle>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/20 p-0.5 rounded-full border border-white/20 text-xs mr-6">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-rose-800 shadow-xs font-bold'
                  : 'text-amber-100 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>भव्य रसीद (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-rose-800 shadow-xs font-bold'
                  : 'text-amber-100 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>विवरण (Text)</span>
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 space-y-3.5 max-h-[76vh] overflow-y-auto print:max-h-none print:p-8">
          {activeTab === 'preview' ? (
            /* Breathtaking Divine Festive Receipt Visual Preview */
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-full max-w-md mx-auto bg-amber-50/50 rounded-2xl p-2 border-2 border-amber-300/80 shadow-md">
                {generatingPreview ? (
                  <div className="w-full aspect-[1084/1451] flex flex-col items-center justify-center bg-amber-50/70 rounded-xl space-y-2 text-amber-800">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                    <span className="text-xs font-semibold">भव्य रसीद तैयार हो रही है…</span>
                  </div>
                ) : previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Festive Donation Receipt Preview"
                      className="w-full h-auto rounded-xl shadow-inner border border-amber-200"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      A4 PDF Ready
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[1084/1451] flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
                    पूर्वावलोकन उपलब्ध नहीं
                  </div>
                )}
              </div>

              {/* Quick Download Buttons under Preview */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="h-8 text-xs font-semibold border-rose-200 text-rose-800 hover:bg-rose-50 hover:border-rose-300"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                  )}
                  PDF डाउनलोड करें
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  className="h-8 text-xs font-semibold border-amber-200 text-amber-900 hover:bg-amber-50 hover:border-amber-300"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  इमेज (PNG) डाउनलोड
                </Button>
              </div>
            </div>
          ) : (
            /* Classic Detail Card view */
            <div
              className="relative border-4 border-double border-amber-500/80 rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 shadow-inner"
              id="printable-receipt"
            >
              <div className="absolute top-1.5 left-2 text-amber-700 text-xs font-serif font-bold">
                🚩 ॐ
              </div>
              <div className="absolute top-1.5 right-2 text-amber-700 text-xs font-serif font-bold">
                卐 🚩
              </div>

              <div className="text-center border-b-2 border-amber-400 pb-3 pt-1">
                <h2 className="text-xl font-extrabold text-amber-950 tracking-wide font-serif">
                  {currentEntity.name}
                </h2>
                <p className="text-xs font-semibold text-rose-700 mt-1">
                  {currentEvent.title}
                </p>
                <div className="mt-2 inline-block bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-[11px] px-3.5 py-0.5 rounded-full shadow-xs">
                  सहयोग / चंदा पावती (Donation Receipt)
                </div>
              </div>

              <div className="flex justify-between items-center text-xs mt-3 px-2 py-1 bg-amber-100/60 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-950 font-mono">
                  रसीद सं० / S.No: #{String(donation.serialNumber).padStart(4, '0')}
                </span>
                <span className="text-amber-900 font-mono text-[11px]">
                  दिनांक: <span className="font-bold">{donation.date}</span>
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs border-b border-amber-200 pb-3">
                <div>
                  <p className="text-slate-500 text-[11px]">सहयोगकर्ता का नाम (Donor Name):</p>
                  <p className="text-base font-bold text-slate-950">{donation.name}</p>
                </div>
              </div>

              <div className="mt-3 bg-amber-50/70 rounded-xl p-3 border border-amber-300">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">स्वीकृत राशि (Pledged):</span>
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      ₹{donation.acceptedAmount.toLocaleString('hi-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">भुगतान माध्यम (Mode):</span>
                    <p className="text-sm font-bold text-amber-800 font-mono">
                      {donation.paymentMode === 'ONL' ? '📲 ऑनलाइन (UPI/QR)' : '💵 नकद (Cash)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-amber-200">
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-300">
                    <span className="text-emerald-800 font-semibold text-[10px] uppercase block">
                      प्राप्त राशि (Received)
                    </span>
                    <p className="text-base font-black text-emerald-800 font-mono">
                      ₹{donation.receivedAmount.toLocaleString('hi-IN')}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      donation.balanceAmount > 0
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold text-[10px] uppercase block">
                      शेष बकाया (Balance Due)
                    </span>
                    <p className="text-base font-black font-mono">
                      ₹{donation.balanceAmount.toLocaleString('hi-IN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] font-serif italic text-amber-950 font-medium">
                  "{currentEntity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।'}"
                </p>
              </div>
            </div>
          )}

          {/* Quick WhatsApp Phone override & PDF attach toggle */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>व्हाट्सएप मोबाइल नंबर (WhatsApp Number):</span>
                <span className="text-[11px] text-slate-400 font-mono">10 अंक</span>
              </label>
              <Input
                placeholder="उदा० 9835012345"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="font-mono text-xs h-9 bg-white"
              />
              {!donation.phone && (
                <p className="text-[11px] text-amber-700">
                  इस दानदाता का नंबर सेव नहीं है — ऊपर नंबर दर्ज करें।
                </p>
              )}
            </div>

            {/* Attach PDF Checkbox */}
            <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachPdf}
                onChange={(e) => setAttachPdf(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-slate-800">
                📎 साथ में भव्य PDF रसीद भेजें (Attach Official PDF Receipt)
              </span>
            </label>
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
              प्रिंट
            </Button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
              disabled={sending}
              className="flex-1 sm:flex-none h-10 sm:h-9 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium"
              title="व्हाट्सएप ऐप में खोलकर मैन्युअल भेजें"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              व्हाट्सएप खोलें
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleAutoSend}
              disabled={sending}
              className="flex-1 sm:flex-none h-10 sm:h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              {sending
                ? 'भेजा जा रहा है…'
                : attachPdf
                ? 'PDF रसीद भेजें (Auto)'
                : 'सीधे भेजें (Auto)'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
