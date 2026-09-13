import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Copy,
  Check,
  Printer,
  Download,
  Smartphone,
  Coins,
  Flame,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChandaQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

const PRESET_AMOUNTS = [251, 501, 1100, 2100, 5100, 11000];

export const ChandaQRCodeModal: React.FC<ChandaQRCodeModalProps> = ({
  isOpen,
  onClose,
  defaultAmount,
}) => {
  const { currentEntity, currentEvent, currentStaffMember } = useSamiti();
  const [selectedAmount, setSelectedAmount] = useState<string>(
    defaultAmount && defaultAmount > 0 ? String(defaultAmount) : '1100'
  );
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync defaultAmount when modal opens or prop updates
  useEffect(() => {
    if (isOpen && defaultAmount && defaultAmount > 0) {
      setSelectedAmount(String(defaultAmount));
    }
  }, [isOpen, defaultAmount]);

  // A member who has been given their own UPI id collects into that account;
  // everyone else falls back to the unit's official one. The money either way
  // is reconciled through the existing cash handover ledger.
  const memberUpiId = currentStaffMember?.upiId?.trim();
  const isPersonalUpi = !!memberUpiId;
  const upiId = memberUpiId || currentEntity?.upiId || 'durgapuja.narayanpur@upi';
  // Calling a collector's personal account "आधिकारिक" (official) on a poster a
  // donor keeps would be misleading, so the label names the collector instead.
  const upiLabel = isPersonalUpi ? 'संग्रहकर्ता UPI आईडी' : 'आधिकारिक UPI आईडी';
  const payeeName = currentEntity?.name || 'श्री दुर्गा पूजा समिति नारायणपुर';
  const parsedAmount = parseFloat(selectedAmount) || 0;

  // Standard UPI URI format: upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR&tn={note}
  const note = encodeURIComponent(`${currentEntity?.name || 'श्री दुर्गा पूजा'} - चंदा सहयोग`);
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${parsedAmount > 0 ? parsedAmount : ''}&cu=INR&tn=${note}`;

  // Generate crisp high-resolution scannable QR Code Data URL locally & offline
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiLink, {
      width: 500,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation failed:', err);
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encodeURIComponent(upiLink)}`;
        if (isMounted) setQrDataUrl(fallbackUrl);
      });

    return () => {
      isMounted = false;
    };
  }, [upiLink]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success(`${isPersonalUpi ? 'आपकी' : 'समिति की'} UPI ID कॉपी हो गई: ${upiId}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `🚩 *${currentEntity?.name || 'श्री दुर्गा पूजा समिति'}* 🚩\n\nमाँ दुर्गा के पूजन एवं भव्य आयोजन हेतु आपका पावन चंदा सहयोग सादर आमंत्रित है।\n\n💰 *सहयोग राशि:* ₹${parsedAmount.toLocaleString('hi-IN')}\n📍 *${upiLabel}${isPersonalUpi && currentStaffMember?.name ? ` (${currentStaffMember.name})` : ''}:* ${upiId}\n\n📲 *सीधे UPI ऐप द्वारा दान करें:*\n${upiLink}\n\n॥ जय माता दी ॥ 🙏`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  // High-Resolution 819x966 Poster Image Downloader using HTML5 Canvas
  const handleDownloadPoster = async () => {
    setIsGeneratingDownload(true);
    const toastId = toast.loading('उच्च गुणवत्ता वाला QR पोस्टर तैयार हो रहा है...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 819;
      canvas.height = 966;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1. Draw base clean poster background (has zero baked-in text/QR)
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = reject;
        baseImg.src = '/images/durga/instant-upi-card-bg.jpg';
      });
      ctx.drawImage(baseImg, 0, 0, 819, 966);

      // 2. Draw live QR code onto clean white box
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      // QR box coordinates: x: 300, y: 280, w: 270, h: 270
      ctx.drawImage(qrImg, 300, 280, 270, 270);

      // 3. Draw amount text inside the clean amount pill
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4a0d0d';
      ctx.font = 'bold 36px monospace, sans-serif';
      ctx.fillText(`₹${parsedAmount.toLocaleString('hi-IN')}`, 435, 608);

      ctx.fillStyle = '#823e14';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('स्कैन कर दान करें', 435, 630);

      // 4. Draw UPI container elements on canvas:
      // Smaller red button on LEFT: x: 130, y: 688, w: 120, h: 36
      ctx.fillStyle = '#9e1818';
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(130, 688, 120, 36, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('📋 कॉपी करें', 190, 711);

      // UPI label & ID on RIGHT of button: x: 265
      ctx.textAlign = 'left';
      ctx.fillStyle = '#803810';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(upiLabel, 265, 703);

      ctx.fillStyle = '#381106';
      ctx.font = 'bold 19px monospace, sans-serif';
      ctx.fillText(upiId, 265, 726);

      // Convert to blob and download
      canvas.toBlob(blob => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `दुर्गा_पूजा_डिजिटल_चंदा_QR_₹${parsedAmount}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('डिजिटल चंदा QR पोस्टर डाउनलोड हो गया! 🎉', { id: toastId });
      }, 'image/png');
    } catch (err) {
      console.error('Poster export error:', err);
      toast.error('पोस्टर डाउनलोड में त्रुटि हुई।', { id: toastId });
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg w-[96vw] max-h-[94vh] flex flex-col p-0 overflow-hidden bg-gradient-to-b from-[#3a060d] via-[#240307] to-[#1a0205] text-white border border-amber-500/50 shadow-2xl rounded-3xl print:bg-white print:border-none print:shadow-none print:max-h-none print:overflow-visible print:w-full print:max-w-none [&>button]:text-white/80 [&>button]:hover:text-white [&>button]:z-20 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:top-3.5 [&>button]:right-3.5 print:[&>button]:hidden">
        {/* ------------------------------------------------------------- */}
        {/* SACRED FESTIVE MODAL HEADER                                  */}
        {/* ------------------------------------------------------------- */}
        <DialogHeader className="relative p-3.5 sm:p-4 bg-gradient-to-r from-[#991b1b] via-[#851111] to-[#6b0909] text-white border-b border-amber-500/40 shrink-0 print:hidden">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-0.5 text-left">
              <DialogTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-white font-serif tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
                <span>डिजिटल चंदा QR कोड (Instant UPI)</span>
              </DialogTitle>
              <p className="text-[13px] text-amber-200/90 font-medium">
                {currentEntity?.name || 'श्री दुर्गा पूजा समिति'} • {currentEvent?.title || 'दुर्गा पूजा महोत्सव'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ------------------------------------------------------------- */}
        {/* SCROLLABLE MODAL CONTENT (Fluid Responsive Poster + Controls) */}
        {/* ------------------------------------------------------------- */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(94vh-125px)] space-y-4 print:p-0 print:max-h-none print:overflow-visible">
          {/* Printable Devotional Poster Card (Container Query Enabled for 100% Fluid Scaling) */}
          <div
            ref={cardRef}
            className="@container relative w-full max-w-[400px] sm:max-w-[430px] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/80 select-none bg-[#faefe0] print:border-none print:shadow-none print:max-w-none print:w-[680px]"
            style={{ aspectRatio: '819 / 966' }}
          >
            {/* Clean Devotional Poster Art: 100% free of baked-in static text/QR */}
            <img
              src="/images/durga/instant-upi-card-bg.jpg"
              alt="Durga Puja Chanda UPI QR Poster"
              className="w-full h-full object-cover block pointer-events-none"
            />

            {/* 1. Dynamic Scannable QR Code Overlay: Positioned precisely in the white card */}
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: '36.5%',
                top: '28.8%',
                width: '33.0%',
                height: '28.0%',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scannable UPI QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[12px] text-amber-900 font-bold animate-pulse">
                  <Flame className="w-5 h-5 text-amber-600 mb-1" />
                  <span>QR बन रहा है...</span>
                </div>
              )}
            </div>

            {/* 2. Dynamic Amount Badge Overlay: Centered inside the clean ivory pill */}
            <div
              className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none"
              style={{
                left: '35.65%',
                top: '58.38%',
                width: '34.92%',
                height: '8.28%',
              }}
            >
              <div
                className="font-black font-mono text-[#4a0d0d] tracking-tight leading-none"
                style={{ fontSize: 'clamp(14px, 5.0cqw, 24px)' }}
              >
                ₹{parsedAmount.toLocaleString('hi-IN')}
              </div>
              <div
                className="font-bold text-[#823e14] tracking-wide leading-tight mt-0.5"
                style={{ fontSize: 'clamp(7.5px, 2.6cqw, 11.5px)' }}
              >
                स्कैन कर दान करें
              </div>
            </div>

            {/* 3. Official UPI ID Container Overlay: Button on LEFT, UPI ID on RIGHT */}
            <div
              className="absolute flex items-center gap-[2.5cqw]"
              style={{
                left: '12.70%',
                top: '69.56%',
                width: '74.72%',
                height: '7.14%',
                paddingLeft: '3.2cqw',
                paddingRight: '3.2cqw',
              }}
            >
              {/* Smaller, compact Copy Button on LEFT */}
              <button
                type="button"
                onClick={handleCopyUpi}
                className="bg-gradient-to-r from-[#9e1818] to-[#b71c1c] hover:from-[#b01c1c] hover:to-[#c82222] text-white border border-amber-300/90 rounded-md sm:rounded-lg flex items-center justify-center gap-1 font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                style={{
                  height: '46%',
                  padding: '0 2.2cqw',
                  fontSize: 'clamp(7.5px, 2.0cqw, 10.5px)',
                }}
                title="UPI ID कॉपी करें"
              >
                {copied ? (
                  <Check className="shrink-0 text-emerald-300" style={{ width: 'clamp(8px, 2.0cqw, 11px)', height: 'clamp(8px, 2.0cqw, 11px)' }} />
                ) : (
                  <Copy className="shrink-0 text-amber-200" style={{ width: 'clamp(8px, 2.0cqw, 11px)', height: 'clamp(8px, 2.0cqw, 11px)' }} />
                )}
                <span>{copied ? 'कॉपी हुआ' : 'कॉपी करें'}</span>
              </button>

              {/* UPI ID Details on RIGHT of the button */}
              <div className="flex flex-col justify-center min-w-0">
                <div
                  className="font-bold text-[#803810] leading-none whitespace-nowrap"
                  style={{ fontSize: 'clamp(7px, 2.0cqw, 10px)' }}
                >
                  {upiLabel}
                </div>
                <div
                  className="font-black font-mono text-[#381106] leading-tight whitespace-nowrap mt-0.5 tracking-tight select-all"
                  style={{ fontSize: 'clamp(8.5px, 2.7cqw, 13px)' }}
                >
                  {upiId}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Amount Selectors (Non-print controls) */}
          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-3 sm:p-3.5 space-y-2.5 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>सहयोग राशि चुनें (Quick Amount):</span>
              </span>
              <span className="text-[13px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                वर्तमान: ₹{parsedAmount.toLocaleString('hi-IN')}
              </span>
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {PRESET_AMOUNTS.map(amt => {
                const isSelected = parsedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(String(amt))}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black font-mono transition-all border active:scale-95 flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30'
                        : 'bg-white/10 text-white/90 border-white/10 hover:bg-white/20 hover:border-amber-400/50'
                    }`}
                  >
                    ₹{amt.toLocaleString('hi-IN')}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-300/80">
                अन्य राशि (₹):
              </span>
              <Input
                type="number"
                min="1"
                placeholder="मनचाही राशि दर्ज करें..."
                value={selectedAmount}
                onChange={e => setSelectedAmount(e.target.value)}
                className="pl-24 h-9 text-xs font-mono font-bold bg-white/10 border-amber-500/30 text-white focus-visible:ring-amber-400 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL ACTION BAR (Print, Download, Share, Open UPI)           */}
        {/* ------------------------------------------------------------- */}
        <div className="p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-[#2a0409] to-[#1c0205] border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintQR}
              className="h-9 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
              title="QR स्टैंड प्रिंट करें"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-amber-300" />
              <span>प्रिंट स्टैंड</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPoster}
              disabled={isGeneratingDownload}
              className="h-9 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
              title="उच्च गुणवत्ता में पोस्टर डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-amber-300" />
              <span>डाउनलोड पोस्टर</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-9 px-3 text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/40 rounded-xl"
              title="दानदाता को WhatsApp पर भेजें"
            >
              <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>शेयर करें</span>
            </Button>
          </div>

          {/* Right Action: Direct UPI Intent Launcher */}
          <a
            href={upiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 sm:flex-initial"
          >
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-4 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-950" />
              <span>UPI ऐप में खोलें</span>
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChandaQRCodeModal;
