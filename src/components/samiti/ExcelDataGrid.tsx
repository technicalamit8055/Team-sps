import React, { useState, useMemo, useEffect } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { SamitiDonation, DonationCategory, DONATION_CATEGORIES } from '@/types/samiti';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppReceiptModal } from './WhatsAppReceiptModal';
import { QuickDonationDialog } from './QuickDonationDialog';
import {
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  LayoutGrid,
  Table,
  Phone,
  Plus,
  ArrowRight,
  Wallet,
} from 'lucide-react';
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

export const ExcelDataGrid: React.FC = () => {
  const { currentEntity, currentEvent, donations, deleteDonation } = useSamiti();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'CASH' | 'ONL'>('ALL');
  const [sortField, setSortField] = useState<'serialNumber' | 'name' | 'acceptedAmount' | 'balanceAmount'>('serialNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // View Mode: auto-detect mobile vs desktop, with manual user toggle
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'grid';
    }
    return 'grid';
  });

  // Responsive listener for window resize
  useEffect(() => {
    const handleResize = () => {
      // only auto-switch if not manually interacted on small screens
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered and sorted records
  const filteredDonations = useMemo(() => {
    return donations
      .filter(d => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const match =
            d.name.toLowerCase().includes(term) ||
            (d.identity && d.identity.toLowerCase().includes(term)) ||
            (d.caste && d.caste.toLowerCase().includes(term)) ||
            (d.address1 && d.address1.toLowerCase().includes(term)) ||
            (d.address2 && d.address2.toLowerCase().includes(term)) ||
            (d.phone && d.phone.includes(term)) ||
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
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [donations, searchTerm, categoryFilter, balanceFilter, modeFilter, sortField, sortAsc]);

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

  return (
    <div className="space-y-4">
      {/* Sleek Modern Control Bar (Mobile & Tablet Optimized) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Top search & Primary action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="नाम, दुकान, पिता का नाम, पता या मोबाइल नं०..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white h-9"
            />
          </div>

          {/* View Mode Toggle & Desktop Quick Add */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="कार्ड दृश्य (Mobile Touch Friendly)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">कार्ड</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="एक्सेल स्प्रेडशीट ग्रिड"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ग्रिड</span>
              </button>
            </div>

            {/* Desktop Add Button (Hidden on smallest screens since FAB handles it) */}
            <div className="hidden sm:block">
              <QuickDonationDialog />
            </div>
          </div>
        </div>

        {/* Clean, Segmented Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          {/* Category Chips (Horizontally scrollable on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-slate-400 font-medium text-[11px] shrink-0">श्रेणी:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.code}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Status & Mode Toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto">
            {/* Balance status */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setBalanceFilter('ALL')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  balanceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                सभी
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('DUE')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  balanceFilter === 'DUE' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600'
                }`}
              >
                बकाया
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('PAID')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  balanceFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                चुकता
              </button>
            </div>

            {/* Payment Mode */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setModeFilter('ALL')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  modeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                सभी
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('CASH')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  modeFilter === 'CASH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                नकद
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('ONL')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  modeFilter === 'ONL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                UPI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OPTION A: TOUCH-FRIENDLY CARD VIEW (MOBILE & TABLET ADAPTIVE)      */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredDonations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
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

                return (
                  <div
                    key={row.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 relative"
                  >
                    {/* Top Row: S.NUM, Category & Mode */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          #{row.serialNumber}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-mono font-bold ${cat.badgeColor}`}>
                          {cat.code} • {cat.labelHi.split('/')[0]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            row.paymentMode === 'ONL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {row.paymentMode}
                        </span>
                        {isDue ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            बकाया
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {row.caste}
                          </span>
                        )}
                      </div>

                      {row.identity && (
                        <p className="text-xs text-slate-600 font-medium line-clamp-1">
                          {row.identity}
                        </p>
                      )}

                      {(row.address1 || row.address2) && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          📍 {row.address1} {row.address2 ? `, ${row.address2}` : ''}
                        </p>
                      )}

                      {row.phone && (
                        <a
                          href={`tel:${row.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-mono mt-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{row.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Financial Amounts Strip */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">स्वीकृत (Pledged)</span>
                        <span className="font-mono font-semibold text-slate-800">
                          ₹{row.acceptedAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div className="border-x border-slate-200 px-1">
                        <span className="text-[10px] text-emerald-600 block font-mono">प्राप्त (Received)</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{row.receivedAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-500 block font-mono">बकाया (Due)</span>
                        <span className={`font-mono font-bold ${isDue ? 'text-rose-600' : 'text-slate-400'}`}>
                          ₹{row.balanceAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => openReceiptModal(row)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        <span>व्हाट्सएप रसीद भेजें</span>
                      </Button>

                      <div className="flex items-center gap-1">
                        <QuickDonationDialog
                          initialData={row}
                          triggerButton={
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-slate-200 text-slate-600 hover:text-slate-900"
                              title="संपादित करें"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingId(row.id)}
                          className="h-8 w-8 p-0 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="हटाएँ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Mobile Summary Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 uppercase font-bold">
              <span>कुल योग ({filteredDonations.length} प्रविष्टियाँ)</span>
              <span>नकद: ₹{visibleTotals.cash.toLocaleString('hi-IN')} | UPI: ₹{visibleTotals.online.toLocaleString('hi-IN')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">कुल स्वीकृत</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{visibleTotals.accepted.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block">कुल प्राप्त</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{visibleTotals.received.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 block">कुल बकाया</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  ₹{visibleTotals.balance.toLocaleString('hi-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* OPTION B: FULL SPREADSHEET HORIZONTAL GRID VIEW                    */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="bg-slate-50 px-4 sm:px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-800 tracking-wide uppercase font-mono">
                चंदा रजिस्टर (Donation Ledger)
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-600 font-medium hidden sm:inline">
                {currentEntity.name}
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              दिखाई गई प्रविष्टियाँ: <span className="font-bold text-slate-900">{filteredDonations.length}</span>
            </div>
          </div>

          {/* The 11 Columns DataGrid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                  <th
                    onClick={() => handleSort('serialNumber')}
                    className="p-3 border-r border-slate-100 cursor-pointer hover:bg-slate-100 text-center whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span>S.NUM</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="p-3 border-r border-slate-100 whitespace-nowrap text-center">VIL/EMP/SHO/OTH</th>
                  <th
                    onClick={() => handleSort('name')}
                    className="p-3 border-r border-slate-100 cursor-pointer hover:bg-slate-100 whitespace-nowrap min-w-[140px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>NAME</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="p-3 border-r border-slate-100 min-w-[150px]">IDENTITY</th>
                  <th className="p-3 border-r border-slate-100 whitespace-nowrap">CASTE</th>
                  <th className="p-3 border-r border-slate-100 min-w-[140px]">ADDRESS.1</th>
                  <th className="p-3 border-r border-slate-100 min-w-[130px]">ADDRESS.2</th>
                  <th
                    onClick={() => handleSort('acceptedAmount')}
                    className="p-3 border-r border-slate-100 cursor-pointer hover:bg-slate-100 text-right whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1 font-mono">
                      <span>ACCEPTED AMMOUNT</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right whitespace-nowrap min-w-[110px] text-emerald-700 font-mono font-bold">
                    RECEIVABLE AMOUNT
                  </th>
                  <th
                    onClick={() => handleSort('balanceAmount')}
                    className="p-3 border-r border-slate-100 cursor-pointer hover:bg-slate-100 text-right whitespace-nowrap min-w-[110px] font-mono font-bold"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>BALANCE AMOUNT</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="p-3 border-r border-slate-100 text-center whitespace-nowrap">CASH/ONL</th>
                  <th className="p-3 text-center whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600">कोई प्रविष्टि नहीं मिली</p>
                      <p className="text-xs text-slate-400 mt-1">
                        सर्च फिल्टर बदलें या नया चंदा जोड़ें।
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((row, index) => {
                    const cat = DONATION_CATEGORIES[row.category] || DONATION_CATEGORIES.OTH;
                    const isDue = row.balanceAmount > 0;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* S.NUM */}
                        <td className="p-3 border-r border-slate-100 text-center font-mono font-bold text-slate-600 text-xs">
                          #{row.serialNumber}
                        </td>

                        {/* VIL/EMP/SHO/OTH */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {cat.code}
                          </span>
                        </td>

                        {/* NAME */}
                        <td className="p-3 border-r border-slate-100 font-semibold text-slate-900">
                          {row.name}
                          {row.phone && (
                            <span className="block text-[10px] font-normal text-slate-400 font-mono">
                              📞 {row.phone}
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

                        {/* ADDRESS.1 */}
                        <td className="p-3 border-r border-slate-100 text-slate-600">
                          {row.address1 || <span className="text-slate-300">-</span>}
                        </td>

                        {/* ADDRESS.2 */}
                        <td className="p-3 border-r border-slate-100 text-slate-500">
                          {row.address2 || <span className="text-slate-300">-</span>}
                        </td>

                        {/* ACCEPTED AMMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-semibold text-slate-800">
                          ₹{row.acceptedAmount.toLocaleString('hi-IN')}
                        </td>

                        {/* RECEIVABLE AMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                          ₹{row.receivedAmount.toLocaleString('hi-IN')}
                        </td>

                        {/* BALANCE AMOUNT */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono">
                          {isDue ? (
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ₹{row.balanceAmount.toLocaleString('hi-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">₹0</span>
                          )}
                        </td>

                        {/* CASH/ONL */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              row.paymentMode === 'ONL'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {row.paymentMode}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReceiptModal(row)}
                              title="व्हाट्सएप रसीद भेजें"
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>

                            <QuickDonationDialog
                              initialData={row}
                              triggerButton={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="संपादित करें"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              }
                            />

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingId(row.id)}
                              title="हटाएँ"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Sticky Auto-Sum Footer */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 text-xs">
                  <td colSpan={7} className="p-3 text-right font-mono uppercase tracking-wider text-slate-600">
                    कुल योग ({filteredDonations.length} रिकॉर्ड):
                  </td>
                  <td className="p-3 text-right font-mono text-sm border-r border-slate-200 text-slate-900">
                    ₹{visibleTotals.accepted.toLocaleString('hi-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-sm border-r border-slate-200 text-emerald-700 bg-emerald-50/50">
                    ₹{visibleTotals.received.toLocaleString('hi-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-sm border-r border-slate-200 text-rose-600 bg-rose-50/50">
                    ₹{visibleTotals.balance.toLocaleString('hi-IN')}
                  </td>
                  <td colSpan={2} className="p-3 text-center text-[11px] font-mono text-slate-600">
                    नकद: ₹{visibleTotals.cash.toLocaleString('hi-IN')} | UPI: ₹{visibleTotals.online.toLocaleString('hi-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR 1-TAP QUICK ENTRY          */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <QuickDonationDialog
          triggerButton={
            <button
              type="button"
              className="h-14 w-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/40 flex items-center justify-center transition-transform active:scale-95 border-2 border-white/20"
              title="त्वरित चंदा प्रविष्टि (+)"
            >
              <Plus className="w-7 h-7" />
            </button>
          }
        />
      </div>

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
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="max-w-[92vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>क्या आप यह चंदा प्रविष्टि हटाना चाहते हैं?</AlertDialogTitle>
            <AlertDialogDescription>
              यह प्रविष्टि स्थायी रूप से हटा दी जाएगी और वित्तीय योग स्वतः पुनः गणना हो जाएगा।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2">
            <AlertDialogCancel>रद्द करें</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteDonation(deletingId);
                  setDeletingId(null);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              हाँ, हटाएँ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
