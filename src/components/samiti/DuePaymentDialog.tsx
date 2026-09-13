import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { PaymentMode, SamitiDonation, DonationPayment } from '@/types/samiti';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Banknote,
  QrCode,
  Wallet,
  CheckCircle2,
  AlertCircle,
  History,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';

interface DuePaymentDialogProps {
  donation: SamitiDonation;
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QUICK_COLLECTORS = ['सूरज', 'ओमवीर', 'विशाल', 'नीरज', 'रंजीत'];

const formatINR = (n: number) => `₹${(Number(n) || 0).toLocaleString('hi-IN')}`;

const formatDay = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' });
};

const MODE_LABEL: Record<PaymentMode, string> = {
  CASH: '💵 नकद',
  ONL: '📲 ऑनलाइन',
  MIXED: 'मिश्रित',
};

/**
 * "बकाया जमा करें" — records a follow-up instalment for a donor who did not
 * clear the full pledge on the first visit.
 *
 * The collector types only what is being handed over this time; the running
 * total and the new balance are derived, so nobody has to add up past
 * instalments by hand to fill in the जमा राशि field.
 */
export const DuePaymentDialog: React.FC<DuePaymentDialogProps> = ({
  donation,
  triggerButton,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { recordDonationPayment, isCollectorMode, currentStaffMember } = useSamiti();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const workerCollectorName = currentStaffMember?.name || 'सुनील वर्मा';

  const balance = Math.max(0, donation.acceptedAmount - donation.receivedAmount);

  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(donation.paymentMode === 'ONL' ? 'ONL' : 'CASH');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectorName, setCollectorName] = useState<string>(
    isCollectorMode ? workerCollectorName : donation.collectorName || 'कार्यकर्ता प्रतिनिधि'
  );
  const [note, setNote] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the dialog opens so a previous entry never
  // leaks into the next donor's instalment.
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentMode(donation.paymentMode === 'ONL' ? 'ONL' : 'CASH');
      setDate(new Date().toISOString().split('T')[0]);
      setCollectorName(isCollectorMode ? workerCollectorName : donation.collectorName || 'कार्यकर्ता प्रतिनिधि');
      setNote('');
      setTimeout(() => amountInputRef.current?.focus(), 150);
    }
  }, [isOpen, donation, isCollectorMode, workerCollectorName]);

  const parsedAmount = parseFloat(amount) || 0;
  const newReceived = donation.receivedAmount + parsedAmount;
  const newBalance = Math.max(0, donation.acceptedAmount - newReceived);
  const exceedsBalance = parsedAmount > balance;

  /**
   * What the history panel shows. Entries saved before the instalment log
   * existed have none, so the already-received amount is shown as the
   * opening instalment — matching what gets persisted on the first save.
   */
  const history: DonationPayment[] = useMemo(() => {
    const existing = Array.isArray(donation.payments) ? donation.payments : [];
    if (existing.length > 0) return existing;
    if (donation.receivedAmount > 0) {
      return [{
        id: `pay-${donation.id}-opening`,
        amount: donation.receivedAmount,
        paymentMode: donation.paymentMode,
        date: donation.date,
        collectorName: donation.collectorName,
        note: 'प्रथम जमा',
        createdAt: donation.createdAt,
      }];
    }
    return [];
  }, [donation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedAmount <= 0) {
      toast.error('कृपया इस बार जमा की गई राशि दर्ज करें।');
      return;
    }
    if (exceedsBalance) {
      toast.error(`जमा राशि शेष बकाया ${formatINR(balance)} से अधिक नहीं हो सकती।`);
      return;
    }

    recordDonationPayment(donation.id, {
      amount: parsedAmount,
      paymentMode,
      date,
      collectorName: collectorName.trim(),
      note: note.trim(),
    });

    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            type="button"
            className="h-8 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>बकाया जमा करें</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg w-[96vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gradient-to-b from-emerald-50/30 via-white to-emerald-50/20 border-emerald-300/80 shadow-2xl rounded-3xl [&>button]:text-white/80 [&>button]:hover:text-white [&>button]:z-20 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-4 sm:p-5 border-b border-emerald-500/30 overflow-hidden shrink-0">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 pr-8 sm:pr-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[12px] font-extrabold tracking-wide uppercase flex items-center gap-1.5">
                <Wallet className="w-3 h-3" />
                बकाया जमा
              </span>
              <span className="text-[12px] text-white/70 font-medium font-mono">
                रसीद #{String(donation.serialNumber).padStart(4, '0')}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight">{donation.name}</h2>
            {donation.identity && (
              <p className="text-[13px] text-white/70 font-medium">{donation.identity}</p>
            )}
          </div>
        </div>

        <form id="due-payment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Current standing */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
              <div className="text-[12px] font-bold text-slate-600">स्वीकृत राशि</div>
              <div className="text-base font-black font-mono text-slate-900">{formatINR(donation.acceptedAmount)}</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="text-[12px] font-bold text-emerald-800">अब तक जमा</div>
              <div className="text-base font-black font-mono text-emerald-700">{formatINR(donation.receivedAmount)}</div>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-2xs ${balance === 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'}`}>
              <div className={`text-[12px] font-bold ${balance === 0 ? 'text-emerald-800' : 'text-rose-800'}`}>शेष बकाया</div>
              <div className={`text-base font-black font-mono ${balance === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatINR(balance)}</div>
            </div>
          </div>

          {balance === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-emerald-900">
                इस दानदाता का पूरा चंदा जमा हो चुका है — कोई बकाया शेष नहीं है।
              </div>
            </div>
          ) : (
            <>
              {/* This instalment */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  इस बार जमा राशि
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-emerald-600 font-bold">₹</span>
                  <Input
                    ref={amountInputRef}
                    type="number"
                    min="0"
                    max={balance}
                    step="1"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    className={`pl-7 h-11 text-base font-mono font-black rounded-xl ${exceedsBalance
                      ? 'text-rose-700 border-rose-300 focus-visible:ring-rose-500'
                      : 'text-emerald-800 border-emerald-200 focus-visible:ring-emerald-500'
                      }`}
                  />
                </div>

                {/* Quick fills capped at the outstanding balance */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance))}
                    className="text-[12px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white border border-emerald-700 active:scale-95"
                  >
                    पूरा बकाया {formatINR(balance)}
                  </button>
                  {[100, 500, 1000].filter(v => v < balance).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="text-[12px] font-bold px-2 py-1 rounded-lg bg-white text-slate-700 border border-emerald-200 hover:border-emerald-400 active:scale-95"
                    >
                      {formatINR(v)}
                    </button>
                  ))}
                </div>

                {exceedsBalance && (
                  <p className="text-[12px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>यह राशि शेष बकाया {formatINR(balance)} से अधिक है।</span>
                  </p>
                )}
              </div>

              {/* Live preview of the resulting totals */}
              {parsedAmount > 0 && !exceedsBalance && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-bold text-slate-500">नई जमा राशि</div>
                    <div className="text-sm font-black font-mono text-emerald-700">{formatINR(newReceived)}</div>
                  </div>
                  <div className="text-slate-300 font-black">→</div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-slate-500">नया बकाया</div>
                    <div className={`text-sm font-black font-mono ${newBalance === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {newBalance === 0 ? 'पूरा चुकता ✅' : formatINR(newBalance)}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode & date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-800 block mb-1.5">भुगतान माध्यम</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CASH')}
                      className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 ${paymentMode === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300'
                        }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>💵 नकद</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('ONL')}
                      className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 ${paymentMode === 'ONL'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50 hover:border-blue-300'
                        }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>📲 ऑनलाइन</span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800 block mb-1.5">जमा दिनांक</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl bg-white focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Collector & note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold text-slate-800">संग्रहकर्ता</Label>
                    {isCollectorMode && (
                      <span className="text-[12px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>🔒</span>
                        <span>लॉक्ड</span>
                      </span>
                    )}
                  </div>
                  <Input
                    value={collectorName}
                    onChange={e => setCollectorName(e.target.value)}
                    disabled={isCollectorMode}
                    className={`h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl ${isCollectorMode ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700' : 'bg-white'
                      } focus-visible:ring-emerald-500`}
                  />
                  {!isCollectorMode && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[11px] text-slate-400">कार्यकर्ता:</span>
                      {QUICK_COLLECTORS.map(nm => (
                        <button
                          key={nm}
                          type="button"
                          onClick={() => setCollectorName(nm)}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                        >
                          {nm}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-800 block mb-1.5">टिप्पणी (वैकल्पिक)</Label>
                  <Input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="जैसे: दूसरी किस्त"
                    className="h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl bg-white focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Instalment history */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[13px] font-bold text-slate-700">भुगतान इतिहास</span>
                <span className="text-[12px] text-slate-400 ml-auto font-mono">{history.length} किस्त</span>
              </div>
              <div className="divide-y divide-slate-100">
                {history.map(p => (
                  <div key={p.id} className="px-3 py-2 flex items-center gap-2 text-[13px]">
                    <span className="font-mono text-slate-500 w-14 shrink-0">{formatDay(p.date)}</span>
                    <span className="font-mono font-black text-emerald-700 w-16 shrink-0">{formatINR(p.amount)}</span>
                    <span className="text-slate-600 shrink-0">{MODE_LABEL[p.paymentMode] || p.paymentMode}</span>
                    <span className="text-slate-400 truncate ml-auto text-right">
                      {[p.collectorName, p.note].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-emerald-200/80 bg-white/80 backdrop-blur p-3 sm:p-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-11 px-4 rounded-xl text-xs font-bold border-slate-200"
          >
            बंद करें
          </Button>
          <Button
            type="submit"
            form="due-payment-form"
            disabled={balance === 0 || parsedAmount <= 0 || exceedsBalance}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>जमा दर्ज करें</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
