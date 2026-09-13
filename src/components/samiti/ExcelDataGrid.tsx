import React, { useState, useMemo, useEffect } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { SamitiDonation, DonationCategory, DONATION_CATEGORIES } from '@/types/samiti';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppReceiptModal } from './WhatsAppReceiptModal';
import { QuickDonationDialog } from './QuickDonationDialog';
import { DuePaymentDialog } from './DuePaymentDialog';
import { toast } from 'sonner';
import { sendWhatsAppReceipt, toBase64Pdf } from '@/lib/whatsapp';
import { toReceiptPayload } from '@/lib/samitiReceipt';
import { generateReceiptPdfDataUrl } from '@/lib/receiptPdfGenerator';
import {
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  FileSpreadsheet,
  LayoutGrid,
  Table,
  Phone,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Crown,
  Eye,
  MoreVertical,
  HandCoins,
  Wallet,
  ShieldCheck,
  Loader2,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** "2026-09-13" → "13 सित॰" for the compact register column. */
const formatEntryDay = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'short' });
};

/** Full "13 सितम्बर 2026" form, used for the column's hover tooltip. */
const formatEntryDayLong = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

interface ExcelDataGridProps {
  isCollectorMode?: boolean;
  collectorName?: string;
  /** नया चंदा जोड़ने का संवाद खोलें (parent-owned QuickDonationDialog) */
  onAddDonation?: () => void;
}

export const ExcelDataGrid: React.FC<ExcelDataGridProps> = ({
  isCollectorMode: propCollectorMode,
  collectorName: propCollectorName,
  onAddDonation,
}) => {
  const { currentEntity, currentEvent, donations, updateDonation, deleteDonation, isCollectorMode: contextCollectorMode, currentStaffMember } = useSamiti();
  const { profile } = useAuth();

  const isCollector = propCollectorMode !== undefined ? propCollectorMode : contextCollectorMode;
  const workerName = propCollectorName || profile?.full_name || currentStaffMember?.name || 'सुनील वर्मा';

  // Toggle between worker's own entries vs all unit entries.
  // Defaults to ALL so a collector immediately sees the existing unit-wide
  // chanda register and can verify who has already donated before collecting.
  const [collectorScope, setCollectorScope] = useState<'MINE' | 'ALL'>('ALL');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'CASH' | 'ONL'>('ALL');
  const [sortField, setSortField] = useState<'serialNumber' | 'name' | 'acceptedAmount' | 'balanceAmount' | 'date'>('serialNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // View Mode: cards vs grid
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'grid') {
        setViewMode('cards');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Modals state
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<SamitiDonation | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [sendingReceiptId, setSendingReceiptId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered and sorted records
  const filteredDonations = useMemo(() => {
    return donations
      .filter(d => {
        // In collector mode, filter by worker's own collections when scope is 'MINE'
        if (isCollector && collectorScope === 'MINE') {
          // Exact (trimmed, case-insensitive) name match. Substring matching
          // plus hardcoded demo names used to attribute other collectors'
          // entries to whoever was logged in.
          const cName = (d.collectorName || '').trim().toLowerCase();
          const wName = workerName.trim().toLowerCase();
          if (!cName || cName !== wName) return false;
        }

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const match =
            d.name.toLowerCase().includes(term) ||
            (d.identity && d.identity.toLowerCase().includes(term)) ||
            (d.caste && d.caste.toLowerCase().includes(term)) ||
            (d.village && d.village.toLowerCase().includes(term)) ||
            (d.address1 && d.address1.toLowerCase().includes(term)) ||
            (d.address2 && d.address2.toLowerCase().includes(term)) ||
            (d.phone && d.phone.includes(term)) ||
            (d.collectorName && d.collectorName.toLowerCase().includes(term)) ||
            String(d.serialNumber).includes(term);

          if (!match) return false;
        }

        if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
        if (balanceFilter === 'DUE' && d.balanceAmount <= 0) return false;
        if (balanceFilter === 'PAID' && d.balanceAmount > 0) return false;
        if (modeFilter !== 'ALL' && d.paymentMode !== modeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // ISO YYYY-MM-DD sorts correctly as a plain string; the ?? keeps rows
        // with no date (legacy/Excel-imported) from throwing in localeCompare.
        const valA = sortField === 'date' ? a.date ?? '' : a[sortField];
        const valB = sortField === 'date' ? b.date ?? '' : b[sortField];
        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [
    donations,
    isCollector,
    collectorScope,
    workerName,
    searchTerm,
    categoryFilter,
    balanceFilter,
    modeFilter,
    sortField,
    sortAsc,
  ]);

  // Column totals for visible records
  const visibleTotals = useMemo(() => {
    return filteredDonations.reduce(
      (acc, d) => {
        acc.accepted += d.acceptedAmount || 0;
        acc.received += d.receivedAmount || 0;
        acc.balance += d.balanceAmount || 0;
        if (d.paymentMode === 'CASH') acc.cash += d.receivedAmount || 0;
        if (d.paymentMode === 'ONL') acc.online += d.receivedAmount || 0;
        return acc;
      },
      { accepted: 0, received: 0, balance: 0, cash: 0, online: 0 }
    );
  }, [filteredDonations]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const openReceiptModal = (donation: SamitiDonation) => {
    setSelectedDonationForReceipt(donation);
    setIsReceiptOpen(true);
  };

  /**
   * One-tap send straight to the donor's saved number. Falls back to the
   * receipt modal when no number is on file, or when the send fails so the
   * collector can fix the number or use the manual wa.me route.
   */
  const sendReceiptDirect = async (donation: SamitiDonation) => {
    if (!donation.phone || donation.phone.replace(/\D/g, '').length < 10) {
      toast.info('इस दानदाता का नंबर सेव नहीं है — रसीद विंडो में नंबर दर्ज करें।');
      openReceiptModal(donation);
      return;
    }

    setSendingReceiptId(donation.id);
    try {
      // The receipt goes out as the PDF plus the message as its caption, so a
      // render failure has to surface rather than silently degrade to text only.
      const pdfDataUrl = await generateReceiptPdfDataUrl(donation, currentEntity, currentEvent);

      await sendWhatsAppReceipt({
        phone: donation.phone,
        ...toReceiptPayload(donation, currentEntity, currentEvent),
        pdfBuffer: toBase64Pdf(pdfDataUrl),
      });
      toast.success(`भव्य PDF रसीद ${donation.name} को भेज दी गई! ✅`);
    } catch (err) {
      toast.error((err as Error).message, { description: 'रसीद विंडो से दोबारा कोशिश करें।' });
      openReceiptModal(donation);
    } finally {
      setSendingReceiptId(null);
    }
  };

  const toggleHandover = (donation: SamitiDonation) => {
    updateDonation(donation.id, {
      isHandoverDone: !donation.isHandoverDone,
    });
  };

  return (
    <div className="space-y-4">
      {/* Control & Search Bar - Matching Reference Mockup */}
      <div className="bg-white border border-amber-200/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Top Search Input + Grid/List View Toggle + New Donation Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
            <Input
              placeholder="नाम, दुकान, पिता का नाम, पता या मोबाइल नंबर खोजें..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 text-xs border-amber-200/80 bg-[#fffdfa] focus-visible:bg-white focus-visible:border-amber-400 h-9 rounded-xl font-medium"
            />
          </div>

          {/* View Toggles & Red Add Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 min-w-0">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`h-9 w-9 sm:h-auto sm:w-auto flex items-center justify-center sm:p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="कार्ड दृश्य"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-9 w-9 sm:h-auto sm:w-auto flex items-center justify-center sm:p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="रजिस्टर ग्रिड"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>

            {/* नया चंदा जोड़ें — पंडाल व पूजा व्यय के "नया खर्चा वाउचर" जैसा */}
            {onAddDonation && (
              <Button
                onClick={onAddDonation}
                className="bg-gradient-to-r from-[#cf1d32] to-[#990e1f] hover:from-[#b91527] hover:to-[#830a18] text-white font-serif font-black text-xs sm:text-sm tracking-wide h-9 px-4 rounded-xl shrink-0 border border-amber-400/70 shadow-md shadow-rose-900/30 ring-1 ring-amber-300/30 transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3.5] text-amber-300 shrink-0" />
                <span className="whitespace-nowrap font-black">
                  नया चंदा<span className="hidden xs:inline"> जोड़ें</span>
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Collector Scope Toggle (Mine vs All) */}
        {isCollector && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-amber-500/10 border border-amber-300/70 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <span>👤</span>
                <span>प्रविष्टि दृश्य:</span>
              </span>
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-amber-300 text-xs">
                <button
                  type="button"
                  onClick={() => setCollectorScope('MINE')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    collectorScope === 'MINE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-900 hover:text-amber-950'
                  }`}
                >
                  <span className="sm:hidden">मेरी</span>
                  <span className="hidden sm:inline">मेरी प्रविष्टियाँ (My Entries)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollectorScope('ALL')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    collectorScope === 'ALL'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-900 hover:text-amber-950'
                  }`}
                >
                  <span className="sm:hidden">समस्त यूनिट</span>
                  <span className="hidden sm:inline">समस्त यूनिट प्रविष्टियाँ (All)</span>
                </button>
              </div>
            </div>
            <div className="text-[13px] text-amber-800 font-medium">
              संग्रहकर्ता: <strong className="text-slate-900">{workerName}</strong>
            </div>
          </div>
        )}

        {/* Segmented Filter Controls matching Reference Design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Category Chips: श्रेणी: सभी (N) | VIL (N) | EMP (N) | SHO (N) | OTH (N) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <span className="text-slate-500 font-bold text-[13px] shrink-0 font-serif">श्रेणी:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 transition-all font-mono ${
                categoryFilter === 'ALL'
                  ? 'bg-[#990e1f] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              सभी ({donations.length})
            </button>

            {(Object.keys(DONATION_CATEGORIES) as DonationCategory[]).map(catKey => {
              const cat = DONATION_CATEGORIES[catKey];
              const count = donations.filter(d => d.category === catKey).length;
              const isSelected = categoryFilter === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border font-mono ${
                    isSelected
                      ? 'bg-[#990e1f] text-white border-[#990e1f] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.code}</span>
                  <span className="text-[12px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Payment Method & Balance Chips: भुगतान विधि: सभी | बकाया | चुकता | नकद | UPI */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <span className="text-slate-500 font-bold text-[13px] shrink-0 font-serif">भुगतान विधि:</span>
            <button
              type="button"
              onClick={() => {
                setBalanceFilter('ALL');
                setModeFilter('ALL');
              }}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                balanceFilter === 'ALL' && modeFilter === 'ALL'
                  ? 'bg-[#990e1f] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              सभी
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter(balanceFilter === 'DUE' ? 'ALL' : 'DUE')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                balanceFilter === 'DUE'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
              }`}
            >
              बकाया
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter(balanceFilter === 'PAID' ? 'ALL' : 'PAID')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                balanceFilter === 'PAID'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              चुकता
            </button>
            <button
              type="button"
              onClick={() => setModeFilter(modeFilter === 'CASH' ? 'ALL' : 'CASH')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shrink-0 border flex items-center gap-1 ${
                modeFilter === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span>💵</span>
              <span>नकद</span>
            </button>
            <button
              type="button"
              onClick={() => setModeFilter(modeFilter === 'ONL' ? 'ALL' : 'ONL')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shrink-0 border flex items-center gap-1 ${
                modeFilter === 'ONL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <span>📲</span>
              <span>UPI</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OPTION A: TOUCH-FRIENDLY CARD VIEW (MOBILE & TABLET ADAPTIVE)      */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredDonations.length === 0 ? (
            <div className="bg-white border border-amber-200/80 rounded-2xl p-10 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-700">कोई चंदा प्रविष्टि नहीं मिली</p>
              <p className="text-xs text-slate-400 mt-1">
                सर्च फिल्टर बदलें या नया चंदा दर्ज करें।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDonations.map(row => {
                const cat = DONATION_CATEGORIES[row.category] || DONATION_CATEGORIES.OTH;
                const isDue = row.balanceAmount > 0;
                const isVip = row.acceptedAmount >= 10000;

                return (
                  <div
                    key={row.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 relative hover:shadow-md ${isVip ? 'border-amber-400/90 ring-1 ring-amber-400/30' : 'border-slate-200'
                      }`}
                  >
                    {/* Top Row: S.NUM, Category & Mode */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                          #{row.serialNumber}
                        </span>
                        {formatEntryDay(row.date) && (
                          <span
                            className="font-mono text-[12px] text-slate-500 whitespace-nowrap"
                            title={formatEntryDayLong(row.date)}
                          >
                            {formatEntryDay(row.date)}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-[12px] font-mono font-bold ${cat.badgeColor}`}>
                          {cat.code} • {cat.labelHi.split('/')[0]}
                        </Badge>
                        {isVip && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[12px] font-bold inline-flex items-center gap-1 border-none py-0 px-2 shadow-2xs">
                            <Crown className="w-2.5 h-2.5" />
                            दानवीर
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded-md ${row.paymentMode === 'ONL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                        >
                          {row.paymentMode}
                        </span>
                        {isDue ? (
                          <span className="text-[12px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            बकाया
                          </span>
                        ) : (
                          <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            चुकता
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Contributor Name, Identity, Address & Phone */}
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {row.name}
                        </h4>
                        {row.caste && (
                          <span className="text-[13px] text-slate-400 shrink-0 font-medium">
                            {row.caste}
                          </span>
                        )}
                      </div>

                      {row.identity && (
                        <p className="text-xs text-slate-600 font-medium line-clamp-1">
                          {row.identity}
                        </p>
                      )}

                      {(row.village || row.address1 || row.address2) && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          📍 {[row.village, row.address1, row.address2].filter(Boolean).join(', ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1">
                        {row.phone ? (
                          <a
                            href={`tel:${row.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-mono"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{row.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[13px] text-slate-400">फोन दर्ज नहीं</span>
                        )}

                        {/* Handover Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleHandover(row)}
                          className={`text-[12px] font-semibold px-2 py-0.5 rounded-full transition-all inline-flex items-center gap-1 border ${row.isHandoverDone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          title="रोकड़ संदूक मिलान स्थिति बदलें"
                        >
                          <HandCoins className="w-2.5 h-2.5" />
                          <span>{row.isHandoverDone ? 'रोकड़ जमा ✓' : 'रोकड़ बाकी'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Amounts Strip */}
                    <div className="bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/70 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[12px] text-slate-400 block font-mono">स्वीकृत (Pledged)</span>
                        <span className="font-mono font-semibold text-slate-800">
                          ₹{row.acceptedAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div className="border-x border-amber-200/80 px-1">
                        <span className="text-[12px] text-emerald-700 block font-mono">प्राप्त (Received)</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{row.receivedAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[12px] text-rose-600 block font-mono">बकाया (Due)</span>
                        <span className={`font-mono font-bold ${isDue ? 'text-rose-600' : 'text-slate-400'}`}>
                          ₹{row.balanceAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => sendReceiptDirect(row)}
                        disabled={sendingReceiptId === row.id}
                        className="w-full xs:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 xs:h-8 rounded-xl shadow-xs"
                        title={
                          row.phone
                            ? `${row.phone} पर सीधे भेजें`
                            : 'नंबर सेव नहीं है — रसीद विंडो खुलेगी'
                        }
                      >
                        {sendingReceiptId === row.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        <span>
                          {sendingReceiptId === row.id ? 'भेजा जा रहा है…' : 'व्हाट्सएप रसीद भेजें'}
                        </span>
                      </Button>

                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReceiptModal(row)}
                        className="h-9 w-9 xs:h-8 xs:w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
                        title="रसीद देखें / नंबर बदलें"
                      >
                        <Eye className="w-4 h-4 xs:w-3.5 xs:h-3.5" />
                      </Button>

                      <div className="flex items-center gap-1.5">
                        {isDue && (
                          <DuePaymentDialog
                            donation={row}
                            triggerButton={
                              <Button
                                size="sm"
                                className="h-9 xs:h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] shadow-xs shrink-0"
                                title={`शेष बकाया ₹${row.balanceAmount.toLocaleString('hi-IN')} जमा करें`}
                              >
                                <Wallet className="w-3.5 h-3.5 mr-1" />
                                <span>बकाया जमा</span>
                              </Button>
                            }
                          />
                        )}

                        <QuickDonationDialog
                          initialData={row}
                          isCollectorMode={isCollector}
                          defaultCollectorName={workerName}
                          triggerButton={
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 xs:h-8 xs:w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
                              title="संपादित करें"
                            >
                              <Edit2 className="w-4 h-4 xs:w-3.5 xs:h-3.5" />
                            </Button>
                          }
                        />

                        {!isCollector && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(row.id)}
                            className="h-9 w-9 xs:h-8 xs:w-8 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                            title="हटाएँ"
                          >
                            <Trash2 className="w-4 h-4 xs:w-3.5 xs:h-3.5" />
                          </Button>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Summary Strip */}
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[13px] text-slate-500 uppercase font-bold">
              <span>कुल योग ({filteredDonations.length} प्रविष्टियाँ)</span>
              <span>नकद: ₹{visibleTotals.cash.toLocaleString('hi-IN')} | UPI: ₹{visibleTotals.online.toLocaleString('hi-IN')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
              <div>
                <span className="text-[12px] text-slate-400 block font-medium">कुल स्वीकृत</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{visibleTotals.accepted.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[12px] text-emerald-700 block font-medium">कुल प्राप्त</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{visibleTotals.received.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[12px] text-rose-600 block font-medium">कुल बकाया</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  ₹{visibleTotals.balance.toLocaleString('hi-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* OPTION B: FULL SPREADSHEET HORIZONTAL GRID VIEW (Burgundy Maroon)  */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-amber-300/80 shadow-md overflow-hidden">
          {/* Table Header Title Bar */}
          <div className="bg-gradient-to-r from-[#fff9ec] via-[#fffbf2] to-[#fff9ec] px-3 sm:px-5 py-2.5 border-b border-amber-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-[#8a1424] shrink-0" />
              <span className="font-bold text-[#480911] tracking-wide uppercase font-serif text-xs sm:text-sm whitespace-nowrap">
                चंदा रजिस्टर
                <span className="hidden sm:inline"> (DONATION LEDGER)</span>
              </span>
              <span className="text-amber-500 hidden sm:inline">•</span>
              <span className="text-amber-950 font-serif font-bold truncate hidden sm:inline">
                {currentEntity.name || 'श्री दुर्गा पूजा समिति, नारायणपुर'}
              </span>
            </div>
            <div className="text-amber-900 font-mono text-[13px] hidden sm:block">
              कुल प्रविष्टियाँ: <span className="font-bold text-slate-900">{filteredDonations.length}</span>
            </div>
          </div>

          {/* The 14 Columns DataGrid — below lg the grid scrolls horizontally
              at a fixed legible width; the card view is the primary mobile UI. */}
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[1180px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#630b16] text-white font-bold uppercase text-[12px] sm:text-[13px] tracking-wider border-b border-[#7e111f]">
                  {/* S.NUM — रसीद क्रमांक (Quick Entry: रसीद क्रमांक badge) */}
                  <th
                    onClick={() => handleSort('serialNumber')}
                    className="p-3 border-r border-[#7e111f]/60 cursor-pointer hover:bg-[#720e1c] text-center align-bottom whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-serif normal-case text-[13px]">रसीद क्रमांक</span>
                      <ArrowUpDown className="w-3 h-3 opacity-70" />
                    </div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">S. NUM</div>
                  </th>

                  {/* DATE — दिनांक (auto-filled with the day the entry was made) */}
                  <th
                    onClick={() => handleSort('date')}
                    className="p-3 border-r border-[#7e111f]/60 cursor-pointer hover:bg-[#720e1c] text-center align-bottom whitespace-nowrap min-w-[90px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-serif normal-case text-[13px]">दिनांक</span>
                      <ArrowUpDown className="w-3 h-3 opacity-70" />
                    </div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">DATE</div>
                  </th>

                  {/* VIL/EMP/SHO/OTH — सहयोगकर्ता की श्रेणी */}
                  <th className="p-3 border-r border-[#7e111f]/60 whitespace-nowrap text-center align-bottom">
                    <div className="font-serif normal-case text-[13px]">श्रेणी</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">VIL/EMP/SHO/OTH</div>
                  </th>

                  {/* NAME — सहयोगकर्ता का नाम */}
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3 border-r border-[#7e111f]/60 cursor-pointer hover:bg-[#720e1c] text-left align-bottom whitespace-nowrap min-w-[140px]"
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-serif normal-case text-[13px]">सहयोगकर्ता का नाम</span>
                      <ArrowUpDown className="w-3 h-3 opacity-70" />
                    </div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">NAME</div>
                  </th>

                  {/* IDENTITY — पहचान */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-left align-bottom min-w-[140px] whitespace-nowrap">
                    <div className="font-serif normal-case text-[13px]">पहचान</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">IDENTITY</div>
                  </th>

                  {/* CASTE — जाति */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-left align-bottom whitespace-nowrap">
                    <div className="font-serif normal-case text-[13px]">जाति</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">CASTE</div>
                  </th>

                  {/* VILLAGE — गाँव */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-left align-bottom min-w-[120px] whitespace-nowrap">
                    <div className="font-serif normal-case text-[13px]">गाँव</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">VILLAGE</div>
                  </th>

                  {/* ADDRESS.1 — वार्ड नं० */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-left align-bottom min-w-[130px] whitespace-nowrap">
                    <div className="font-serif normal-case text-[13px]">वार्ड नं०</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">ADDRESS.1</div>
                  </th>

                  {/* ADDRESS.2 — लैंडमार्क */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-left align-bottom min-w-[120px] whitespace-nowrap">
                    <div className="font-serif normal-case text-[13px]">लैंडमार्क</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">ADDRESS.2</div>
                  </th>

                  {/* ACCEPTED AMOUNT — स्वीकृत राशि */}
                  <th
                    onClick={() => handleSort('acceptedAmount')}
                    className="p-3 border-r border-[#7e111f]/60 cursor-pointer hover:bg-[#720e1c] text-right align-bottom whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-serif normal-case text-[13px]">स्वीकृत राशि</span>
                      <ArrowUpDown className="w-3 h-3 opacity-70" />
                    </div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">ACCEPTED AMOUNT</div>
                  </th>

                  {/* RECEIVABLE AMOUNT — जमा राशि */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-right align-bottom whitespace-nowrap min-w-[110px]">
                    <div className="font-serif normal-case text-[13px] text-amber-200">जमा राशि</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">RECEIVABLE AMOUNT</div>
                  </th>

                  {/* BALANCE AMOUNT — शेष बकाया */}
                  <th
                    onClick={() => handleSort('balanceAmount')}
                    className="p-3 border-r border-[#7e111f]/60 cursor-pointer hover:bg-[#720e1c] text-right align-bottom whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-serif normal-case text-[13px]">शेष बकाया</span>
                      <ArrowUpDown className="w-3 h-3 opacity-70" />
                    </div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">BALANCE AMOUNT</div>
                  </th>

                  {/* PAYMENT MODE — भुगतान माध्यम */}
                  <th className="p-3 border-r border-[#7e111f]/60 text-center align-bottom whitespace-nowrap min-w-[100px]">
                    <div className="font-serif normal-case text-[13px]">भुगतान माध्यम</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">CASH/ONL</div>
                  </th>

                  {/* ACTION — कार्रवाई */}
                  <th className="p-3 text-center align-bottom whitespace-nowrap min-w-[90px]">
                    <div className="font-serif normal-case text-[13px]">कार्रवाई</div>
                    <div className="font-mono text-[11px] text-amber-200/70 tracking-normal">ACTION</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600 font-serif">कोई प्रविष्टि नहीं मिली</p>
                      <p className="text-xs text-slate-400 mt-1">
                        सर्च फिल्टर बदलें या नया चंदा जोड़ें।
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((row, index) => {
                    const cat = DONATION_CATEGORIES[row.category] || DONATION_CATEGORIES.OTH;
                    const isDue = row.balanceAmount > 0;
                    const isVip = row.acceptedAmount >= 10000;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-amber-50/50 transition-colors ${
                          isVip ? 'bg-amber-50/20' : index % 2 === 0 ? 'bg-white' : 'bg-[#fdfbf7]'
                        }`}
                      >
                        {/* S.NUM */}
                        <td className="p-3 border-r border-slate-100 text-center font-mono font-bold text-amber-950 text-xs">
                          #{row.serialNumber}
                        </td>

                        {/* DATE — दिनांक (Click to edit directly on register) */}
                        <td
                          className="p-1.5 border-r border-slate-100 text-center font-mono text-[13px] text-slate-600 whitespace-nowrap"
                          title={`${formatEntryDayLong(row.date)} (रजिस्टर में दिनांक बदलने के लिए चुनें)`}
                        >
                          <input
                            type="date"
                            value={row.date || ''}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              if (newDate) {
                                updateDonation(row.id, { date: newDate });
                                toast.success(`रसीद #${row.serialNumber} का दिनांक बदलकर ${newDate} कर दिया गया! 📅`);
                              }
                            }}
                            className="bg-transparent hover:bg-amber-50 focus:bg-white text-[13px] font-mono rounded px-1.5 py-1 border border-transparent hover:border-amber-300 focus:border-amber-500 cursor-pointer outline-none transition-all text-slate-700 font-semibold"
                          />
                        </td>

                        {/* VIL/EMP/SHO/OTH */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span className="text-[12px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {cat.code}
                          </span>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                            {cat.labelHi.split('/')[0].trim()}
                          </div>
                        </td>

                        {/* NAME with phone */}
                        <td className="p-3 border-r border-slate-100 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {isVip && (
                              <span title="दानवीर">
                                <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          {row.phone && (
                            <span className="flex items-center gap-1 text-[12px] font-normal text-slate-500 font-mono mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{row.phone}</span>
                            </span>
                          )}
                        </td>

                        {/* IDENTITY */}
                        <td className="p-3 border-r border-slate-100 text-slate-600">
                          {row.identity || <span className="text-slate-300">-</span>}
                        </td>

                        {/* CASTE */}
                        <td className="p-3 border-r border-slate-100 text-slate-500">
                          {row.caste || <span className="text-slate-300">-</span>}
                        </td>

                        {/* VILLAGE — गाँव */}
                        <td className="p-3 border-r border-slate-100 text-slate-600">
                          {row.village || <span className="text-slate-300">-</span>}
                        </td>

                        {/* ADDRESS.1 — वार्ड नं० */}
                        <td className="p-3 border-r border-slate-100 text-slate-600">
                          {row.address1 && row.address1 !== 'N/A' ? (
                            <span className="whitespace-nowrap">
                              वार्ड नं० <span className="font-mono font-bold text-slate-800">{row.address1}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* ADDRESS.2 */}
                        <td className="p-3 border-r border-slate-100 text-slate-500">
                          {row.address2 || <span className="text-slate-300">-</span>}
                        </td>

                        {/* ACCEPTED AMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-slate-900">
                          ₹{row.acceptedAmount.toLocaleString('hi-IN')}
                        </td>

                        {/* RECEIVABLE AMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-emerald-700">
                          ₹{row.receivedAmount.toLocaleString('hi-IN')}
                        </td>

                        {/* BALANCE AMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono">
                          {isDue ? (
                            /* The due chip doubles as the "collect the rest" button. */
                            <DuePaymentDialog
                              donation={row}
                              triggerButton={
                                <button
                                  type="button"
                                  title={`₹${row.balanceAmount.toLocaleString('hi-IN')} बकाया जमा करें`}
                                  className="group font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Wallet className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <span>₹{row.balanceAmount.toLocaleString('hi-IN')}</span>
                                </button>
                              }
                            />
                          ) : (
                            <span className="text-slate-400 font-medium">₹0</span>
                          )}
                        </td>

                        {/* PAYMENT MODE */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span
                            className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${row.paymentMode === 'ONL'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                          >
                            {row.paymentMode === 'ONL' ? '📲 ONL' : '💵 CASH'}
                          </span>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                            {row.paymentMode === 'ONL' ? 'ऑनलाइन' : 'नकद'}
                          </div>
                        </td>

                        {/* ACTION: 'देखें' Button + 3-dots Dropdown */}
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReceiptModal(row)}
                              className="h-7 px-2 text-xs bg-[#fff9ec] hover:bg-amber-100 text-amber-950 border-amber-300 rounded-lg flex items-center gap-1 font-serif font-bold shadow-2xs transition-all"
                              title="पावती रसीद देखें"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>देखें</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                  title="अन्य विकल्प"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs w-44 bg-white border border-amber-200 shadow-xl rounded-xl p-1">
                                <DropdownMenuItem
                                  onClick={() => sendReceiptDirect(row)}
                                  disabled={sendingReceiptId === row.id}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-amber-50"
                                >
                                  {sendingReceiptId === row.id ? (
                                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                                  ) : (
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                  <span>
                                    {row.phone
                                      ? `रसीद भेजें (${row.phone})`
                                      : 'व्हाट्सएप रसीद भेजें'}
                                  </span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => openReceiptModal(row)}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-amber-50"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>रसीद देखें / नंबर बदलें</span>
                                </DropdownMenuItem>

                                {row.balanceAmount > 0 && (
                                  <DuePaymentDialog
                                    donation={row}
                                    triggerButton={
                                      <div className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer">
                                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>बकाया जमा करें (₹{row.balanceAmount.toLocaleString('hi-IN')})</span>
                                      </div>
                                    }
                                  />
                                )}

                                <QuickDonationDialog
                                  initialData={row}
                                  isCollectorMode={isCollector}
                                  defaultCollectorName={workerName}
                                  triggerButton={
                                    <div className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-amber-50 rounded-lg cursor-pointer">
                                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                      <span>संपादित करें</span>
                                    </div>
                                  }
                                />

                                {!isCollector && (
                                  <DropdownMenuItem
                                    onClick={() => setDeletingId(row.id)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 cursor-pointer hover:bg-rose-50 focus:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>हटाएँ</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Sticky Auto-Sum Footer */}
              <tfoot>
                <tr className="bg-[#fff9ec] text-slate-900 font-bold border-t-2 border-amber-300 text-xs">
                  {/* Spans S.NUM → ADDRESS.2 (9 cols) so the totals below line
                      up with the ACCEPTED / RECEIVABLE / BALANCE columns. */}
                  <td colSpan={9} className="p-3 text-right font-serif uppercase tracking-wider text-amber-950">
                    कुल योग ({filteredDonations.length} रिकॉर्ड):
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm border-r border-amber-200 text-slate-900">
                    ₹{visibleTotals.accepted.toLocaleString('hi-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm border-r border-amber-200 text-emerald-700 bg-emerald-50/40">
                    ₹{visibleTotals.received.toLocaleString('hi-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm border-r border-amber-200 text-rose-600 bg-rose-50/40">
                    ₹{visibleTotals.balance.toLocaleString('hi-IN')}
                  </td>
                  <td className="p-3 text-center border-r border-amber-200 leading-tight">
                    <div className="font-mono text-[12px] font-bold text-emerald-700 whitespace-nowrap">
                      💵 ₹{visibleTotals.cash.toLocaleString('hi-IN')}
                    </div>
                    <div className="font-mono text-[12px] font-bold text-blue-700 whitespace-nowrap">
                      📲 ₹{visibleTotals.online.toLocaleString('hi-IN')}
                    </div>
                  </td>
                  <td className="p-3 bg-[#fff9ec]" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* WhatsApp Receipt Modal */}
      <WhatsAppReceiptModal
        donation={selectedDonationForReceipt}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedDonationForReceipt(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {!isCollector && (
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent className="max-w-[92vw] sm:max-w-lg rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>क्या आप यह चंदा प्रविष्टि हटाना चाहते हैं?</AlertDialogTitle>
              <AlertDialogDescription>
                यह प्रविष्टि स्थायी रूप से हटा दी जाएगी और वित्तीय योग स्वतः पुनः गणना हो जाएगा।
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2">
              <AlertDialogCancel className="rounded-xl">रद्द करें</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingId) {
                    deleteDonation(deletingId);
                    setDeletingId(null);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                हाँ, हटाएँ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
