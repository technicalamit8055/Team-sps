import React, { useState, useEffect, useRef } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { DonationCategory, PaymentMode, DONATION_CATEGORIES, SamitiDonation } from '@/types/samiti';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  Smartphone,
  User,
  Building2,
  MapPin,
  Tag,
  Coins,
  Receipt,
  Banknote,
  QrCode,
  Flame,
  AlertCircle,
  MessageSquare,
  Home,
  Briefcase,
  Store,
  Check,
} from 'lucide-react';
import { WhatsAppReceiptModal } from './WhatsAppReceiptModal';
import { CasteCombobox } from './CasteCombobox';
import { LocalityCombobox } from './LocalityCombobox';
import { toast } from 'sonner';
import { sendWhatsAppReceipt } from '@/lib/whatsapp';
import { toReceiptPayload } from '@/lib/samitiReceipt';

interface QuickDonationDialogProps {
  initialData?: SamitiDonation | null;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
  defaultCollectorName?: string;
  isCollectorMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const WARD_OPTIONS = Array.from({ length: 13 }, (_, i) => String(i + 1));

const PRESET_AMOUNTS = [
  { amount: 501, title: 'शुभ शगुन' },
  { amount: 1100, title: 'विशेष भेंट' },
  { amount: 2100, title: 'लोकप्रिय' },
  { amount: 5100, title: 'विशिष्ट सहयोग' },
  { amount: 11000, title: 'मुख्य यजमान' },
  { amount: 21000, title: 'महायजमान' },
  { amount: 51000, title: 'संरक्षक दान' },
];

const CATEGORY_META: Record<DonationCategory, { icon: React.FC<{ className?: string }>; sublabel: string; activeClass: string; badgeText: string }> = {
  VIL: {
    icon: Home,
    sublabel: 'ग्राम / वार्ड निवासी',
    badgeText: 'ग्रामीण',
    activeClass: 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs',
  },
  EMP: {
    icon: Briefcase,
    sublabel: 'शासकीय / निजी कर्मी',
    badgeText: 'नौकरीपेशा',
    activeClass: 'border-blue-500 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/30 shadow-xs',
  },
  SHO: {
    icon: Store,
    sublabel: 'दुकानदार / व्यावसायिक फर्म',
    badgeText: 'व्यापारी',
    activeClass: 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/30 shadow-xs',
  },
  OTH: {
    icon: Sparkles,
    sublabel: 'अन्य श्रद्धालु / अतिथि',
    badgeText: 'विशिष्ट',
    activeClass: 'border-purple-500 bg-purple-50/90 text-purple-950 ring-2 ring-purple-500/30 shadow-xs',
  },
};

export const QuickDonationDialog: React.FC<QuickDonationDialogProps> = ({
  initialData,
  onSuccess,
  triggerButton,
  defaultCollectorName,
  isCollectorMode: propCollectorMode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { addDonation, updateDonation, currentEvent, currentEntity, donations, staffList, isCollectorMode: contextCollectorMode, currentStaffMember } = useSamiti();

  const isCollector = propCollectorMode !== undefined ? propCollectorMode : contextCollectorMode;
  const workerCollectorName = defaultCollectorName || currentStaffMember?.name || 'सुनील वर्मा';

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  const [createdDonation, setCreatedDonation] = useState<SamitiDonation | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<DonationCategory>(initialData?.category || 'SHO');
  const [identity, setIdentity] = useState(initialData?.identity || '');
  const [caste, setCaste] = useState(initialData?.caste || '');
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [address2, setAddress2] = useState(initialData?.address2 || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [acceptedAmount, setAcceptedAmount] = useState<string>(
    initialData?.acceptedAmount ? String(initialData.acceptedAmount) : '2100'
  );
  const [receivedAmount, setReceivedAmount] = useState<string>(
    initialData?.receivedAmount ? String(initialData.receivedAmount) : '2100'
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialData?.paymentMode || 'CASH');
  const [collectorName, setCollectorName] = useState(initialData?.collectorName || (isCollector ? workerCollectorName : 'कार्यकर्ता प्रतिनिधि'));
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [autoSendReceipt, setAutoSendReceipt] = useState(true);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when initialData or modal opening changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || 'SHO');
      setIdentity(initialData.identity || '');
      setCaste(initialData.caste || '');
      setAddress1(initialData.address1 || '');
      setAddress2(initialData.address2 || '');
      setPhone(initialData.phone || '');
      setAcceptedAmount(String(initialData.acceptedAmount || '2100'));
      setReceivedAmount(String(initialData.receivedAmount || '2100'));
      setPaymentMode(initialData.paymentMode || 'CASH');
      setCollectorName(initialData.collectorName || (isCollector ? workerCollectorName : 'कार्यकर्ता प्रतिनिधि'));
      setRemarks(initialData.remarks || '');
    } else if (isOpen) {
      if (isCollector) {
        setCollectorName(workerCollectorName);
      }
      // Focus name input when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 150);
    } else {
      // Reset when dialog closes
      setName('');
      setIdentity('');
      setPhone('');
      setAddress1('');
      setAddress2('');
      setCaste('');
      setRemarks('');
      setAcceptedAmount('2100');
      setReceivedAmount('2100');
      setCategory('SHO');
      setPaymentMode('CASH');
      if (isCollector) {
        setCollectorName(workerCollectorName);
      }
    }
  }, [initialData, isOpen, isCollector, workerCollectorName]);

  // Keyboard shortcut: Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('quick-donation-form') as HTMLFormElement;
        if (form) form.requestSubmit();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Quick preset amount click
  const handlePresetClick = (amount: number) => {
    setAcceptedAmount(String(amount));
    setReceivedAmount(String(amount));
  };

  const parsedAccepted = parseFloat(acceptedAmount) || 0;
  const parsedReceived = parseFloat(receivedAmount) || 0;
  const calculatedBalance = Math.max(0, parsedAccepted - parsedReceived);

  // Next receipt number preview
  const nextReceiptNumber = donations && donations.length > 0
    ? Math.max(...donations.map(d => d.serialNumber || 0)) + 1
    : 1;

  /**
   * Fire the receipt at the donor's saved number the moment the entry is
   * stored. Runs detached from the dialog (which closes straight after save),
   * so the collector can start the next entry while it goes out.
   *
   * Anything that stops an automatic send — no usable number, no linked
   * WhatsApp session, server down — falls back to the receipt modal so the
   * receipt can still be fixed up and sent by hand.
   */
  const autoSendReceiptFor = async (donation: SamitiDonation) => {
    const cleanPhone = (donation.phone || '').replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      toast.info('नंबर सेव नहीं है — रसीद विंडो में नंबर दर्ज करके भेजें।');
      setCreatedDonation(donation);
      setIsReceiptModalOpen(true);
      return;
    }

    const toastId = toast.loading(`रसीद ${donation.name} को भेजी जा रही है…`);
    try {
      await sendWhatsAppReceipt({
        phone: cleanPhone,
        ...toReceiptPayload(donation, currentEntity, currentEvent),
      });
      toast.success(`रसीद ${donation.name} को भेज दी गई! ✅`, { id: toastId });
    } catch (err) {
      toast.error((err as Error).message, {
        id: toastId,
        description: 'रसीद विंडो से दोबारा कोशिश करें।',
      });
      setCreatedDonation(donation);
      setIsReceiptModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (
      !Number.isFinite(parsedAccepted) ||
      !Number.isFinite(parsedReceived) ||
      parsedAccepted < 0 ||
      parsedReceived < 0
    ) {
      toast.error('राशि ऋणात्मक (negative) नहीं हो सकती। कृपया सही राशि दर्ज करें।');
      return;
    }

    if (initialData) {
      updateDonation(initialData.id, {
        name: name.trim(),
        category,
        identity: identity.trim(),
        caste: caste.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        remarks: remarks.trim(),
      });
      setIsOpen(false);
      onSuccess?.();
    } else {
      const newDonation = addDonation({
        eventId: currentEvent.id,
        name: name.trim(),
        category,
        identity: identity.trim(),
        caste: caste.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        isHandoverDone: false,
        date: new Date().toISOString().split('T')[0],
        remarks: remarks.trim(),
      });

      setIsOpen(false);
      onSuccess?.();

      if (autoSendReceipt) {
        void autoSendReceiptFor(newDonation);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button className="h-9 px-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-amber-400/40">
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ नया चंदा जोड़ें</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-2xl w-[96vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20 border-amber-300/80 shadow-2xl rounded-3xl [&>button]:text-white/80 [&>button]:hover:text-white [&>button]:z-20 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
          {/* ------------------------------------------------------------- */}
          {/* SACRED FESTIVE HEADER BANNER                                  */}
          {/* ------------------------------------------------------------- */}
          <div className="relative bg-gradient-to-r from-rose-950 via-amber-950 to-rose-900 text-white p-4 sm:p-5 border-b border-amber-500/30 overflow-hidden shrink-0">
            {/* Ambient devotional glow & motifs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 sm:pr-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                    {currentEntity?.name || 'श्री दुर्गा पूजा महासमिति'}
                  </span>
                  <span className="text-[10px] text-white/70 font-medium hidden xs:inline">
                    {currentEvent?.title || 'शारदीय नवरात्र 2026'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white font-serif tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{initialData ? 'चंदा पावती संपादन' : 'त्वरित चंदा प्रविष्टि (Quick Chanda Entry)'}</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-100/80 font-serif italic">
                  "माँ दुर्गा के पावन पर्व हेतु डिजिटल सहयोग पावती एवं लेखा संधारण"
                </p>
              </div>

              {/* Receipt Number Preview Badge */}
              <div className="flex items-center self-start sm:self-center gap-2 bg-black/40 border border-amber-400/40 px-3 py-1.5 rounded-xl shadow-inner text-right">
                <Receipt className="w-4 h-4 text-amber-300 shrink-0" />
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-amber-300/80 font-mono font-bold">
                    रसीद क्रमांक
                  </div>
                  <div className="text-xs font-black font-mono text-amber-200">
                    #{String(initialData ? initialData.serialNumber : nextReceiptNumber).padStart(4, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SCROLLABLE FORM BODY                                          */}
          {/* ------------------------------------------------------------- */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-150px)] space-y-4">
            <form id="quick-donation-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector Cards */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>सहयोगकर्ता की श्रेणी (Contributor Category) *</span>
                  </Label>
                  <span className="text-[10px] text-slate-500 font-medium">VIL / EMP / SHO / OTH</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(DONATION_CATEGORIES) as DonationCategory[]).map(catKey => {
                    const cat = DONATION_CATEGORIES[catKey];
                    const meta = CATEGORY_META[catKey];
                    const isSelected = category === catKey;
                    const IconComponent = meta.icon;

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`relative p-2.5 rounded-xl text-left border transition-all duration-150 flex flex-col gap-1 active:scale-[0.98] ${isSelected
                            ? meta.activeClass
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shadow-2xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-600'
                            }`}>
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-mono font-black">{cat.code}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight line-clamp-1">{cat.labelHi.split('/')[0]}</div>
                          <div className="text-[10px] opacity-75 leading-tight line-clamp-1 mt-0.5">{meta.sublabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 1: DEVOTEE & IDENTITY DETAILS                   */}
              {/* ------------------------------------------------------- */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200/70 shadow-xs space-y-3.5">
                {/* Name & Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>सहयोगकर्ता का नाम (Donor Name) *</span>
                    </Label>
                    <Input
                      ref={nameInputRef}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="h-10 text-sm font-semibold text-slate-900 border-slate-200 focus-visible:ring-amber-500 focus-visible:border-amber-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>पहचान / पिता / दुकान का नाम (Firm / Identity)</span>
                    </Label>
                    <Input
                      value={identity}
                      onChange={e => setIdentity(e.target.value)}
                      className="h-10 text-xs font-medium text-slate-900 border-slate-200 focus-visible:ring-amber-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone & Caste */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>व्हाट्सएप मोबाइल नंबर (WhatsApp Phone)</span>
                      </Label>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200/60">
                        📲 रसीद हेतु
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">+91</span>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={e => {
                          const val = e.target.value.replace(/[^\d\s]/g, '');
                          setPhone(val);
                        }}
                        className="h-10 pl-11 text-xs font-mono font-bold text-slate-900 border-slate-200 focus-visible:ring-emerald-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors tracking-wide"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>जाति / समुदाय टैग (Caste / Samaj)</span>
                      </Label>
                      <span className="text-[10px] text-slate-400 font-medium">सांख्यिकी हेतु</span>
                    </div>
                    <CasteCombobox
                      value={caste}
                      onChange={setCaste}
                      className="h-10 text-xs font-medium text-slate-900 border-slate-200 focus-visible:ring-amber-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Address 1 & Address 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>वार्ड नं० (WARD NO)</span>
                    </Label>
                    <Select value={address1} onValueChange={setAddress1}>
                      <SelectTrigger className="h-10 text-xs font-medium text-slate-900 border-slate-200 focus-visible:ring-amber-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors">
                        <SelectValue placeholder="वार्ड नं० चुनें" />
                      </SelectTrigger>
                      <SelectContent>
                        {WARD_OPTIONS.map(ward => (
                          <SelectItem key={ward} value={ward} className="text-xs">
                            वार्ड नं० {ward}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>पता २: पोस्ट / थाना / लैंडमार्क (ADDRESS.2)</span>
                    </Label>
                    <LocalityCombobox
                      value={address2}
                      onChange={setAddress2}
                      className="h-10 text-xs font-medium text-slate-900 border-slate-200 focus-visible:ring-amber-500 rounded-xl bg-slate-50/40 hover:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 2: DONATION AMOUNT & SETTLEMENT                 */}
              {/* ------------------------------------------------------- */}
              <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wide">
                    <div className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      २
                    </div>
                    <span>सहयोग राशि एवं भुगतान व्यवस्था (Donation & Settlement)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-[11px] font-bold text-amber-800 font-mono">
                      शुद्ध संकलन गणना
                    </span>
                  </div>
                </div>

                {/* Auspicious Shagun Preset Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>त्वरित शगुन राशि बटन (Festive Denominations):</span>
                    </span>
                    <span className="text-[10px] text-amber-800/80 font-medium">1-क्लिक में दोनों राशि स्वतः भरें</span>
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {PRESET_AMOUNTS.map(item => {
                      const isMatched = parsedAccepted === item.amount && parsedReceived === item.amount;
                      return (
                        <button
                          key={item.amount}
                          type="button"
                          onClick={() => handlePresetClick(item.amount)}
                          className={`px-2 py-2 rounded-xl text-center border transition-all active:scale-95 flex flex-col items-center justify-center ${isMatched
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs font-extrabold'
                              : 'bg-white text-slate-800 border-amber-200/90 hover:border-amber-400 hover:bg-amber-100/60'
                            }`}
                        >
                          <span className="text-xs font-mono font-black">₹{item.amount.toLocaleString('hi-IN')}</span>
                          <span className={`text-[9px] mt-0.5 leading-none ${isMatched ? 'text-amber-100' : 'text-amber-800/80 font-medium'}`}>
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Columns: Accepted, Received, Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Accepted */}
                  <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-800">
                        स्वीकृत संकल्प राशि *
                      </Label>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded font-bold">
                        Pledged
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={acceptedAmount}
                        onChange={e => setAcceptedAmount(e.target.value)}
                        required
                        className="pl-7 h-10 text-base font-mono font-black text-slate-900 border-amber-200 focus-visible:ring-amber-500 rounded-xl"
                      />
                    </div>
                    <div className="flex gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = parsedAccepted + 500;
                          setAcceptedAmount(String(next));
                          if (parsedReceived === parsedAccepted) setReceivedAmount(String(next));
                        }}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors"
                      >
                        +₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = parsedAccepted + 1000;
                          setAcceptedAmount(String(next));
                          if (parsedReceived === parsedAccepted) setReceivedAmount(String(next));
                        }}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors"
                      >
                        +₹1000
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Received */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-emerald-900">
                        प्राप्त जमा राशि *
                      </Label>
                      <button
                        type="button"
                        onClick={() => setReceivedAmount(acceptedAmount)}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-1.5 py-0.2 rounded transition-colors"
                        title="स्वीकृत राशि के बराबर करें"
                      >
                        ⚡ पूर्ण प्राप्त
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-emerald-600 font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={receivedAmount}
                        onChange={e => setReceivedAmount(e.target.value)}
                        required
                        className="pl-7 h-10 text-base font-mono font-black text-emerald-800 border-emerald-200 focus-visible:ring-emerald-500 rounded-xl"
                      />
                    </div>
                    <div className="text-[10px] text-emerald-700/80 font-medium">
                      नकद / ऑनलाइन जमा खाता
                    </div>
                  </div>

                  {/* Card 3: Balance Display */}
                  <div className={`p-3 rounded-xl border shadow-2xs flex flex-col justify-between ${calculatedBalance === 0
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-rose-50/80 border-rose-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${calculatedBalance === 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                        शेष बकाया (Balance)
                      </span>
                      {calculatedBalance === 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          पूर्ण चुकता
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded animate-pulse">
                          वसूली बाकी
                        </span>
                      )}
                    </div>

                    <div className="my-1">
                      <div className={`text-xl font-black font-mono tracking-tight ${calculatedBalance === 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                        ₹{calculatedBalance.toLocaleString('hi-IN')}
                      </div>
                    </div>

                    <div className="text-[10px] font-medium leading-tight">
                      {calculatedBalance === 0 ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>कोई बकाया नहीं, रसीद पूर्ण भुगतान सहित बनेगी</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>रसीद पर ₹{calculatedBalance.toLocaleString('hi-IN')} बकाया दिखेगा</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Mode & Collector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
                  <div>
                    <Label className="text-xs font-bold text-slate-800 block mb-1.5">
                      भुगतान माध्यम (Payment Mode) *
                    </Label>
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
                        <span>💵 नकद (CASH)</span>
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
                        <span>📲 ऑनलाइन (UPI)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-bold text-slate-800">
                        संग्रहकर्ता / पावती प्रतिनिधि (Collector Name)
                      </Label>
                      {isCollector && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>🔒</span>
                          <span>लॉक्ड</span>
                        </span>
                      )}
                    </div>
                    <Input
                      value={collectorName}
                      onChange={e => setCollectorName(e.target.value)}
                      disabled={isCollector}
                      className={`h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl ${isCollector ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700' : 'bg-white'
                        } focus-visible:ring-amber-500`}
                    />
                    {isCollector ? (
                      <p className="text-[10px] text-amber-800 mt-1 font-medium">
                        यह रसीद स्वतः आपके नाम ({workerCollectorName}) पर दर्ज होगी।
                      </p>
                    ) : (
                      /* Quick collector selection chips */
                      staffList && staffList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[9px] text-slate-400">कार्यकर्ता:</span>
                          {staffList.slice(0, 4).map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setCollectorName(s.name)}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-800"
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700 block mb-1">
                    विशेष टिप्पणी / रसीद नोट (Optional Remarks)
                  </Label>
                  <Input
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="h-9 text-xs text-slate-800 border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 3: DIGITAL RECEIPT AUTO-LAUNCH TOGGLE           */}
              {/* ------------------------------------------------------- */}
              {!initialData && (
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">
                        प्रविष्टि होते ही WhatsApp रसीद स्वतः भेजें
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        {phone.replace(/\D/g, '').length >= 10
                          ? `सुरक्षित करते ही रसीद ${phone.trim()} पर अपने आप चली जाएगी`
                          : 'नंबर दर्ज न होने पर रसीद विंडो खुलेगी, जहाँ से नंबर डालकर भेज सकते हैं'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSendReceipt}
                      onChange={e => setAutoSendReceipt(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}
            </form>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* DIALOG FOOTER / ACTION BAR                                    */}
          {/* ------------------------------------------------------------- */}
          <div className="p-3.5 sm:px-5 sm:py-4 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <span>शॉर्टकट:</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded border border-slate-200 font-bold">
                Ctrl + Enter
              </kbd>
              <span>से तुरंत सुरक्षित करें</span>
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-10 px-4 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-100 rounded-xl flex-1 sm:flex-initial"
              >
                रद्द करें (Cancel)
              </Button>
              <Button
                type="submit"
                form="quick-donation-form"
                size="sm"
                className="h-10 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{initialData ? 'अपडेट सुरक्षित करें' : 'चंदा प्रविष्टि सुरक्षित करें (Save)'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Receipt Modal for newly created record */}
      <WhatsAppReceiptModal
        donation={createdDonation}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </>
  );
};

export default QuickDonationDialog;
