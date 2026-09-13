import React, { useState, useEffect, useRef } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { DonationCategory, PaymentMode, DONATION_CATEGORIES, SamitiDonation } from '@/types/samiti';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles,
  CheckCircle2,
  Smartphone,
  Calendar,
  User,
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
  Lock,
  ArrowUp,
} from 'lucide-react';
import { WhatsAppReceiptModal } from './WhatsAppReceiptModal';
import { CasteCombobox } from './CasteCombobox';
import { LocalityCombobox } from './LocalityCombobox';
import { VillageCombobox } from './VillageCombobox';
import { toast } from 'sonner';
import { sendWhatsAppReceipt, toBase64Pdf } from '@/lib/whatsapp';
import { generateReceiptPdfDataUrl } from '@/lib/receiptPdfGenerator';
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

// 'N/A' is a real, selectable value for donors whose ward is unknown.
const WARD_OPTIONS = ['N/A', ...Array.from({ length: 13 }, (_, i) => String(i + 1))];

const PRESET_AMOUNTS = [51, 101, 201, 251, 501, 1100, 1500, 2100];

const CATEGORY_META: Record<DonationCategory, { icon: React.FC<{ className?: string }>; activeClass: string; idleClass: string; idleIconClass: string; badgeText: string }> = {
  VIL: {
    icon: Home,
    badgeText: 'ग्रामीण',
    activeClass: 'border-emerald-500 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs',
    idleClass: 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50/80',
    idleIconClass: 'bg-emerald-100 text-emerald-700',
  },
  EMP: {
    icon: Briefcase,
    badgeText: 'नौकरीपेशा',
    activeClass: 'border-blue-500 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/30 shadow-xs',
    idleClass: 'border-blue-200 bg-blue-50/40 text-blue-900 hover:border-blue-400 hover:bg-blue-50/80',
    idleIconClass: 'bg-blue-100 text-blue-700',
  },
  SHO: {
    icon: Store,
    badgeText: 'व्यापारी',
    activeClass: 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/30 shadow-xs',
    idleClass: 'border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-400 hover:bg-amber-50/80',
    idleIconClass: 'bg-amber-100 text-amber-700',
  },
  OTH: {
    icon: Sparkles,
    badgeText: 'विशिष्ट',
    activeClass: 'border-purple-500 bg-purple-50/90 text-purple-950 ring-2 ring-purple-500/30 shadow-xs',
    idleClass: 'border-purple-200 bg-purple-50/40 text-purple-900 hover:border-purple-400 hover:bg-purple-50/80',
    idleIconClass: 'bg-purple-100 text-purple-700',
  },
};

// संग्रहकर्ता dropdown ke tay naam — in ke alawa koi aur naam nahi chuna ja sakta
const COLLECTOR_OPTIONS = ['कार्यकर्ता प्रतिनिधि', 'सूरज', 'ओमवीर', 'विशाल', 'नीरज', 'रंजीत', 'सुनील वर्मा', 'अमित कुमार'];

/**
 * Green tick shown beside a label once its field carries a value. Sits in the
 * label row rather than inside the input, since every combobox and the ward
 * Select already occupy their right edge with a chevron.
 */
const FieldTick: React.FC<{ filled: boolean }> = ({ filled }) =>
  filled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : null;

export const QuickDonationDialog: React.FC<QuickDonationDialogProps> = ({
  initialData,
  onSuccess,
  triggerButton,
  defaultCollectorName,
  isCollectorMode: propCollectorMode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { addDonation, updateDonation, currentEvent, currentEntity, donations, isCollectorMode: contextCollectorMode, currentStaffMember, canEditFinalizedAmounts } = useSamiti();

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
  const [village, setVillage] = useState(initialData?.village || '');
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [address2, setAddress2] = useState(initialData?.address2 || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
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
      setVillage(initialData.village || '');
      setAddress1(initialData.address1 || '');
      setAddress2(initialData.address2 || '');
      setPhone(initialData.phone || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setAcceptedAmount(String(initialData.acceptedAmount || '2100'));
      setReceivedAmount(String(initialData.receivedAmount || '2100'));
      setPaymentMode(initialData.paymentMode || 'CASH');
      setCollectorName(initialData.collectorName || (isCollector ? workerCollectorName : 'कार्यकर्ता प्रतिनिधि'));
      setRemarks(initialData.remarks || '');
    } else if (isOpen) {
      if (isCollector) {
        setCollectorName(workerCollectorName);
        // Collectors have no toggle for this, so it must never be left off.
        setAutoSendReceipt(true);
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
      setDate(new Date().toISOString().split('T')[0]);
      setVillage('');
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

  const parsedAccepted = parseFloat(acceptedAmount) || 0;
  const parsedReceived = parseFloat(receivedAmount) || 0;
  const calculatedBalance = Math.max(0, parsedAccepted - parsedReceived);

  /**
   * Visual confirmation that a field carries a value. Filled inputs pick up a
   * soft emerald wash so a collector can see at a glance which details are
   * already captured while scanning the form mid-entry.
   */
  const filledStyle = (value: string) =>
    value.trim()
      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
      : 'bg-slate-50/40 border-slate-200';

  /**
   * Amount locks apply only when revising a receipt that is already on the
   * books — a brand new entry is always free to type. Members without
   * `editFinalizedAmounts` cannot restate the pledge at all, and may only
   * raise what has been collected (the बकाया जमा dialog is the normal route).
   */
  const isEditingSaved = !!initialData;
  const amountsLocked = isEditingSaved && !canEditFinalizedAmounts;
  const savedReceived = initialData?.receivedAmount ?? 0;
  const receivedBelowRecorded = amountsLocked && parsedReceived < savedReceived;

  // Quick preset amount click — inert on a locked receipt, so a stray tap
  // cannot rewrite a pledge the member is not allowed to change.
  const handlePresetClick = (amount: number) => {
    if (amountsLocked) return;
    setAcceptedAmount(String(amount));
    setReceivedAmount(String(amount));
  };

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
      // The receipt goes out as the PDF plus the message as its caption, so a
      // render failure has to surface rather than silently degrade to text only.
      const pdfDataUrl = await generateReceiptPdfDataUrl(donation, currentEntity, currentEvent);

      await sendWhatsAppReceipt({
        phone: cleanPhone,
        ...toReceiptPayload(donation, currentEntity, currentEvent),
        pdfBuffer: toBase64Pdf(pdfDataUrl),
      });
      toast.success(`भव्य PDF रसीद ${donation.name} को भेज दी गई! ✅`, { id: toastId });
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

    if (amountsLocked && parsedAccepted !== (initialData?.acceptedAmount ?? 0)) {
      toast.error('स्वीकृत राशि बदलने का अधिकार केवल एडमिन को है।', {
        description: 'सुधार के लिए एडमिन से संपर्क करें।',
      });
      return;
    }

    if (receivedBelowRecorded) {
      toast.error(`जमा राशि ₹${savedReceived.toLocaleString('hi-IN')} से कम नहीं हो सकती।`, {
        description: 'दानदाता से मिली राशि केवल बढ़ाई जा सकती है — घटाने के लिए एडमिन से संपर्क करें।',
      });
      return;
    }

    if (initialData) {
      updateDonation(initialData.id, {
        name: name.trim(),
        category,
        identity: identity.trim(),
        caste: caste.trim(),
        village: village.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        date: date || initialData.date || new Date().toISOString().split('T')[0],
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
        village: village.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        isHandoverDone: false,
        date: date || new Date().toISOString().split('T')[0],
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
        {triggerButton && (
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        )}

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
                </div>

                <h3 className="text-base sm:text-lg font-black text-white font-serif tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{initialData ? 'चंदा पावती संपादन' : 'त्वरित चंदा प्रविष्टि'}</span>
                </h3>
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
                    <span>सहयोगकर्ता की श्रेणी</span>
                  </Label>
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
                        className={`relative min-w-0 p-2.5 rounded-xl text-left border transition-all duration-150 flex flex-col gap-1 active:scale-[0.98] ${isSelected
                            ? meta.activeClass
                            : meta.idleClass
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shadow-2xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-black/10' : meta.idleIconClass
                            }`}>
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-mono font-black">{cat.code}</span>
                        </div>
                        <div className="min-w-0 w-full">
                          <div className="text-[11px] sm:text-xs font-bold leading-tight break-words hyphens-none">{cat.labelHi.split('/')[0].trim()}</div>
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
                {/* Devotee Name */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>सहयोगकर्ता का नाम *</span>
                    <FieldTick filled={!!name.trim()} />
                  </Label>
                  <Input
                    ref={nameInputRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className={`h-10 text-sm font-semibold focus-visible:ring-amber-500 focus-visible:border-amber-500 rounded-xl hover:bg-white transition-colors ${filledStyle(name)}`}
                  />
                </div>

                {/* WhatsApp Phone & Caste */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>व्हाट्सएप नंबर *</span>
                        <FieldTick filled={!!phone.trim()} />
                      </Label>
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
                        className={`h-10 pl-11 text-xs font-mono font-bold focus-visible:ring-emerald-500 rounded-xl hover:bg-white transition-colors tracking-wide ${filledStyle(phone)}`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>जाति *</span>
                        <FieldTick filled={!!caste.trim()} />
                      </Label>
                    </div>
                    <CasteCombobox
                      value={caste}
                      onChange={setCaste}
                      className={`h-10 text-xs font-medium focus-visible:ring-amber-500 rounded-xl hover:bg-white transition-colors ${filledStyle(caste)}`}
                    />
                  </div>
                </div>

                {/* Village, Ward & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>गाँव *</span>
                      <FieldTick filled={!!village.trim()} />
                    </Label>
                    <VillageCombobox
                      value={village}
                      onChange={setVillage}
                      className={`h-10 text-xs font-medium focus-visible:ring-amber-500 rounded-xl hover:bg-white transition-colors ${filledStyle(village)}`}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>वार्ड नं० *</span>
                      <FieldTick filled={!!address1.trim()} />
                    </Label>
                    <Select value={address1} onValueChange={setAddress1}>
                      <SelectTrigger className={`h-10 text-xs font-medium focus-visible:ring-amber-500 rounded-xl hover:bg-white transition-colors ${filledStyle(address1)}`}>
                        <SelectValue placeholder="वार्ड नं० चुनें" />
                      </SelectTrigger>
                      <SelectContent>
                        {WARD_OPTIONS.map(ward => (
                          <SelectItem key={ward} value={ward} className="text-xs">
                            {ward === 'N/A' ? 'N/A (लागू नहीं)' : `वार्ड नं० ${ward}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>लैंडमार्क *</span>
                      <FieldTick filled={!!address2.trim()} />
                    </Label>
                    <LocalityCombobox
                      value={address2}
                      onChange={setAddress2}
                      className={`h-10 text-xs font-medium focus-visible:ring-amber-500 rounded-xl hover:bg-white transition-colors ${filledStyle(address2)}`}
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------- */}
              {/* SECTION 2: DONATION AMOUNT & SETTLEMENT                 */}
              {/* ------------------------------------------------------- */}
              <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-xs space-y-3.5">
                {/* Quick Amount Preset Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>त्वरित राशि:</span>
                    </span>
                    <span className="text-[10px] text-amber-800/80 font-medium">
                      {amountsLocked ? 'दर्ज रसीद — राशि लॉक है' : '1-क्लिक में दोनों राशि स्वतः भरें'}
                    </span>
                  </div>

                  {amountsLocked && (
                    <div className="mb-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] font-semibold text-rose-900 leading-snug">
                        यह रसीद पहले ही दर्ज हो चुकी है — स्वीकृत राशि बदलने का अधिकार केवल एडमिन को है।
                        {savedReceived > 0 && (
                          <>
                            {' '}जमा राशि ₹{savedReceived.toLocaleString('hi-IN')} से घटाई नहीं जा सकती, केवल बढ़ाई जा सकती है।
                          </>
                        )}
                        <span className="block text-rose-700/90 font-medium mt-0.5">
                          बकाया वसूली के लिए “बकाया जमा करें” का उपयोग करें। नाम, पता व मोबाइल अब भी बदले जा सकते हैं।
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {PRESET_AMOUNTS.map(amount => {
                      const isMatched = parsedAccepted === amount && parsedReceived === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePresetClick(amount)}
                          className={`px-2 py-2 rounded-xl text-center border transition-all active:scale-95 flex items-center justify-center ${isMatched
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs font-extrabold'
                              : 'bg-white text-slate-800 border-amber-200/90 hover:border-amber-400 hover:bg-amber-100/60'
                            }`}
                        >
                          <span className="text-xs font-mono font-black">₹{amount.toLocaleString('hi-IN')}</span>
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
                        स्वीकृत राशि
                      </Label>
                      {amountsLocked && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>लॉक्ड</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={acceptedAmount}
                        onChange={e => setAcceptedAmount(e.target.value)}
                        required
                        readOnly={amountsLocked}
                        title={amountsLocked ? 'दर्ज रसीद की स्वीकृत राशि केवल एडमिन बदल सकते हैं' : undefined}
                        className={`pl-7 h-10 text-base font-mono font-black text-slate-900 border-amber-200 focus-visible:ring-amber-500 rounded-xl ${
                          amountsLocked ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card 2: Received */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-emerald-900">
                        जमा राशि
                      </Label>
                      {amountsLocked && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <ArrowUp className="w-2.5 h-2.5" />
                          <span>केवल बढ़ा सकते हैं</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-emerald-600 font-bold">₹</span>
                      <Input
                        type="number"
                        min={amountsLocked ? savedReceived : 0}
                        value={receivedAmount}
                        onChange={e => setReceivedAmount(e.target.value)}
                        required
                        title={amountsLocked ? `पहले से दर्ज ₹${savedReceived.toLocaleString('hi-IN')} से कम नहीं हो सकती` : undefined}
                        className={`pl-7 h-10 text-base font-mono font-black rounded-xl ${
                          receivedBelowRecorded
                            ? 'text-rose-700 border-rose-300 focus-visible:ring-rose-500'
                            : 'text-emerald-800 border-emerald-200 focus-visible:ring-emerald-500'
                        }`}
                      />
                    </div>
                    {receivedBelowRecorded && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-px" />
                        <span>पहले से ₹{savedReceived.toLocaleString('hi-IN')} जमा है — इससे कम नहीं किया जा सकता।</span>
                      </p>
                    )}
                  </div>

                  {/* Card 3: Balance Display */}
                  <div className={`p-3 rounded-xl border shadow-2xs flex flex-col justify-between ${calculatedBalance === 0
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-rose-50/80 border-rose-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${calculatedBalance === 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                        शेष बकाया
                      </span>
                      {calculatedBalance !== 0 && (
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
                      {calculatedBalance !== 0 && (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>रसीद पर ₹{calculatedBalance.toLocaleString('hi-IN')} बकाया दिखेगा</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date, Payment Mode & Collector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
                  {/* Entry / Receipt Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>रसीद दिनांक (Date)</span>
                      </Label>
                    </div>
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl bg-white focus-visible:ring-amber-500"
                    />
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setDate(new Date().toISOString().split('T')[0])}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-800"
                      >
                        आज (Today)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          setDate(yest.toISOString().split('T')[0]);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-800"
                      >
                        कल (Yesterday)
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800 block mb-1.5">
                      भुगतान माध्यम
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
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-bold text-slate-800">
                        संग्रहकर्ता
                      </Label>
                      {isCollector && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>🔒</span>
                          <span>लॉक्ड</span>
                        </span>
                      )}
                    </div>
                    {isCollector ? (
                      <>
                        <Input
                          value={collectorName}
                          disabled
                          className="h-11 text-xs font-semibold border-slate-200 rounded-xl bg-slate-100 cursor-not-allowed opacity-90 text-slate-700"
                        />
                        <p className="text-[10px] text-amber-800 mt-1 font-medium">
                          यह रसीद स्वतः आपके नाम ({workerCollectorName}) पर दर्ज होगी।
                        </p>
                      </>
                    ) : (
                      <Select value={collectorName} onValueChange={val => setCollectorName(val)}>
                        <SelectTrigger className="h-11 text-xs font-semibold text-slate-900 border-slate-200 rounded-xl bg-white focus:ring-amber-500">
                          <SelectValue placeholder="नाम चुनें" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLLECTOR_OPTIONS.map(name => (
                            <SelectItem key={name} value={name} className="text-xs">
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700 block mb-1">
                    विशेष टिप्पणी / रसीद नोट
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
              {/* Admins only — collectors always auto-send.               */}
              {/* ------------------------------------------------------- */}
              {!initialData && !isCollector && (
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
          <div className="p-3.5 sm:px-5 sm:py-4 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 shrink-0">
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-10 px-4 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-100 rounded-xl flex-1 sm:flex-initial"
              >
                रद्द करें
              </Button>
              <Button
                type="submit"
                form="quick-donation-form"
                size="sm"
                className="h-10 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{initialData ? 'अपडेट सुरक्षित करें' : 'चंदा प्रविष्टि सुरक्षित करें'}</span>
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
