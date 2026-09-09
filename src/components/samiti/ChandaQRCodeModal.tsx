import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QrCode, Copy, Check, Printer, Smartphone, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
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
  const { currentEntity, currentEvent } = useSamiti();
  const [selectedAmount, setSelectedAmount] = useState<string>(
    defaultAmount ? String(defaultAmount) : '1100'
  );
  const [copied, setCopied] = useState(false);

  const upiId = currentEntity.upiId || 'durgapuja.narayanpur@upi';
  const payeeName = currentEntity.name || 'Shree Durga Puja Samiti';
  const parsedAmount = parseFloat(selectedAmount) || 0;

  // Standard UPI URI format: upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR&tn={note}
  const note = encodeURIComponent(`${currentEntity.name} - चंदा सहयोग`);
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${parsedAmount > 0 ? parsedAmount : ''}&cu=INR&tn=${note}`;

  // High quality QR Code image using standard reliable public QR service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('समिति की UPI ID कॉपी हो गई!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[94vw] p-0 overflow-hidden bg-white border-amber-300 rounded-3xl shadow-2xl">
        {/* Divine Header */}
        <DialogHeader className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>डिजिटल चंदा QR कोड (Instant UPI)</span>
            </DialogTitle>
            <p className="text-[11px] text-amber-100 font-medium mt-0.5">
              {currentEntity.name}
            </p>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none print:p-8">
          {/* Printable QR Card */}
          <div className="border-4 border-double border-amber-500/80 rounded-2xl p-4 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 text-center shadow-inner relative">
            <div className="flex justify-between items-center text-xs text-amber-700 font-bold px-1 mb-1">
              <span>🚩 ॐ</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                माँ दुर्गा की असीम कृपा
              </span>
              <span>卐 🚩</span>
            </div>

            <h3 className="text-base font-extrabold text-amber-950 font-serif leading-tight">
              {currentEntity.name}
            </h3>
            <p className="text-[11px] text-amber-900 font-medium">
              📍 {currentEntity.location || 'नारायणपुर'} • {currentEvent.title}
            </p>

            {/* QR Display Container */}
            <div className="my-3 inline-block p-3 bg-white rounded-2xl border-2 border-amber-300 shadow-md">
              <img
                src={qrCodeUrl}
                alt="Chanda UPI QR Code"
                className="w-48 h-48 sm:w-52 sm:h-52 mx-auto object-contain"
                loading="eager"
              />
              <div className="mt-2 text-xs font-mono font-bold text-amber-950 flex items-center justify-center gap-1">
                <span>₹{parsedAmount.toLocaleString('hi-IN')}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (स्कैन कर दान करें)
                </span>
              </div>
            </div>

            {/* UPI ID Badge */}
            <div className="bg-amber-100/70 border border-amber-200 rounded-xl p-2 flex items-center justify-between gap-2 max-w-xs mx-auto">
              <div className="text-left truncate">
                <span className="text-[9px] uppercase font-bold text-amber-800 block">
                  Official Samiti UPI ID:
                </span>
                <span className="text-xs font-mono font-bold text-amber-950 truncate block">
                  {upiId}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUpi}
                className="h-7 px-2 text-xs text-amber-900 hover:bg-amber-200/60 rounded-lg shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {copied ? 'कॉपी' : 'कॉपी करें'}
              </Button>
            </div>

            {/* Accepted UPI Apps Strip */}
            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-slate-500">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">GPay</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">PhonePe</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">Paytm</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">BHIM UPI</span>
            </div>
          </div>

          {/* Quick Preset Amount Selectors */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>सहयोग राशि चुनें (Select Amount):</span>
              <span className="text-[11px] text-amber-700 font-mono">
                वर्तमान: ₹{parsedAmount.toLocaleString('hi-IN')}
              </span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(String(amt))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                    parsedAmount === amt
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  ₹{amt.toLocaleString('hi-IN')}
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                अन्य राशि (₹):
              </span>
              <Input
                type="number"
                placeholder="उदा० 5100"
                value={selectedAmount}
                onChange={e => setSelectedAmount(e.target.value)}
                className="pl-24 text-xs font-mono font-bold h-9"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintQR}
            className="h-9 text-xs border-slate-200 text-slate-700 hover:bg-white"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            प्रिंट QR स्टैंड
          </Button>

          <a
            href={upiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              type="button"
              size="sm"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              UPI ऐप में खोलें
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
