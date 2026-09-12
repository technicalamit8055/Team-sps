import React, { useState, useMemo, useEffect } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { SamitiExpense, ExpenseCategory, EXPENSE_CATEGORIES, PaymentMode } from '@/types/samiti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, Receipt, Phone, LayoutGrid, Table, Sparkles, Building2 } from 'lucide-react';
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

// भुगतानकर्ता (payer) field ke liye quick-fill naam
const QUICK_PAYERS = ['सूरज', 'ओमवीर', 'विशाल', 'नीरज', 'रंजीत'];

export const ExpenseManager: React.FC = () => {
  const { currentEvent, expenses, addExpense, deleteExpense } = useSamiti();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // View Mode: auto-detect mobile vs desktop
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

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('pandal_tent');
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paidBy, setPaidBy] = useState('कोषाध्यक्ष (मनोज कुमार)');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const parsedTotal = parseFloat(totalAmount) || 0;
  const parsedPaid = parseFloat(amountPaid) || 0;
  const calculatedDue = Math.max(0, parsedTotal - parsedPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !parsedTotal) return;

    addExpense({
      eventId: currentEvent.id,
      category,
      vendorName: vendorName.trim(),
      vendorPhone: vendorPhone.trim(),
      totalAmount: parsedTotal,
      amountPaid: parsedPaid,
      paymentMode,
      paidBy: paidBy.trim(),
      expenseDate,
      notes: notes.trim(),
    });

    setVendorName('');
    setVendorPhone('');
    setTotalAmount('');
    setAmountPaid('');
    setNotes('');
    setIsOpen(false);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          exp.vendorName.toLowerCase().includes(term) ||
          (exp.notes && exp.notes.toLowerCase().includes(term)) ||
          (exp.vendorPhone && exp.vendorPhone.includes(term)) ||
          exp.voucherNo.toLowerCase().includes(term);
        if (!match) return false;
      }

      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totals = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, e) => {
        acc.total += e.totalAmount || 0;
        acc.paid += e.amountPaid || 0;
        acc.due += e.balanceDue || 0;
        return acc;
      },
      { total: 0, paid: 0, due: 0 }
    );
  }, [filteredExpenses]);

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-amber-500" />
            <Input
              placeholder="वेंडर नाम, वाउचर सं० या विवरण खोजें..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-xs border-amber-200 bg-amber-50/20 focus-visible:bg-white h-9 rounded-xl"
            />
          </div>

          {/* View Mode Toggle & Add Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="कार्ड दृश्य (Mobile Touch Friendly)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">कार्ड दृश्य</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="तालिका दृश्य (Spreadsheet Grid)"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ग्रिड</span>
              </button>
            </div>

            {/* Desktop Add Voucher Trigger */}
            <div className="hidden sm:block">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs h-9 px-3.5 rounded-xl">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + नया खर्चा वाउचर
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg w-[94vw] max-h-[92vh] overflow-y-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>नया खर्चा वाउचर दर्ज करें (Expense Voucher)</span>
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-3.5 mt-2 text-xs">
                    <div>
                      <Label className="text-xs font-medium">व्यय श्रेणी (Category) *</Label>
                      <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                        <SelectTrigger className="mt-1 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(catKey => {
                            const cat = EXPENSE_CATEGORIES[catKey];
                            return (
                              <SelectItem key={catKey} value={catKey} className="text-xs">
                                <span>{cat.icon} </span>
                                <span>{cat.labelHi}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">वेंडर / फर्म का नाम *</Label>
                        <Input
                          placeholder="उदा० भवानी टेंट हाउस"
                          value={vendorName}
                          onChange={e => setVendorName(e.target.value)}
                          required
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">वेंडर फोन</Label>
                        <Input
                          placeholder="उदा० 9835112233"
                          value={vendorPhone}
                          onChange={e => setVendorPhone(e.target.value)}
                          className="mt-1 font-mono text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-amber-50/40 p-3 rounded-2xl border border-amber-200">
                      <div>
                        <Label className="text-[11px] font-medium text-slate-700">कुल बिल (₹) *</Label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={totalAmount}
                          onChange={e => setTotalAmount(e.target.value)}
                          required
                          className="mt-1 font-mono font-bold text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-medium text-emerald-800">भुगतान (₹) *</Label>
                        <Input
                          type="number"
                          placeholder="20000"
                          value={amountPaid}
                          onChange={e => setAmountPaid(e.target.value)}
                          required
                          className="mt-1 font-mono font-bold text-emerald-700 border-emerald-300 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] font-medium text-rose-700">शेष देनदारी (₹)</Label>
                        <div className="mt-1 h-9 px-2 rounded-xl bg-white border border-rose-200 flex items-center font-mono font-bold text-rose-600 text-xs">
                          ₹{calculatedDue.toLocaleString('hi-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium">माध्यम</Label>
                        <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                          <SelectTrigger className="mt-1 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">💵 नकद (CASH)</SelectItem>
                            <SelectItem value="ONL">📲 ऑनलाइन (UPI)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">दिनांक</Label>
                        <Input
                          type="date"
                          value={expenseDate}
                          onChange={e => setExpenseDate(e.target.value)}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">भुगतानकर्ता</Label>
                        <Input
                          placeholder="कोषाध्यक्ष"
                          value={paidBy}
                          onChange={e => setPaidBy(e.target.value)}
                          className="mt-1 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 shrink-0">जल्दी भरें:</span>
                      {QUICK_PAYERS.map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setPaidBy(name)}
                          className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                            paidBy === name
                              ? 'bg-amber-500 border-amber-500 text-white font-medium'
                              : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    <div>
                      <Label className="text-xs font-medium">विवरण / सामान का ब्योरा</Label>
                      <Input
                        placeholder="उदा० 15 फीट प्रतिमा निर्माण अग्रिम"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="mt-1 text-xs rounded-xl"
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl">
                        रद्द करें
                      </Button>
                      <Button type="submit" size="sm" className="bg-slate-900 text-white rounded-xl font-semibold">
                        सुरक्षित करें
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Clean Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              categoryFilter === 'ALL' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सभी ({expenses.length})
          </button>
          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(catKey => {
            const cat = EXPENSE_CATEGORIES[catKey];
            const count = expenses.filter(e => e.category === catKey).length;
            const isSelected = categoryFilter === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.labelHi.split(' ')[0]}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OPTION A: TOUCH-FRIENDLY EXPENSE CARDS (MOBILE & TABLET ADAPTIVE)  */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-700">कोई खर्चा वाउचर नहीं मिला</p>
              <p className="text-xs text-slate-400 mt-1">
                सर्च फिल्टर बदलें या नया खर्चा वाउचर दर्ज करें।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredExpenses.map(row => {
                const cat = EXPENSE_CATEGORIES[row.category] || EXPENSE_CATEGORIES.misc;
                const isDue = row.balanceDue > 0;

                return (
                  <div
                    key={row.id}
                    className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 relative hover:shadow-md"
                  >
                    {/* Top Row: Voucher No, Category & Mode */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200">
                          {row.voucherNo}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 border-slate-200 text-slate-700">
                          {cat.icon} {cat.labelHi}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            row.paymentMode === 'ONL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {row.paymentMode}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {row.expenseDate}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Vendor Name, Phone & Notes */}
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {row.vendorName}
                        </h4>
                        {row.paidBy && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            भुगतान: {row.paidBy}
                          </span>
                        )}
                      </div>

                      {row.notes && (
                        <p className="text-xs text-slate-600 font-medium line-clamp-2">
                          {row.notes}
                        </p>
                      )}

                      {row.vendorPhone && (
                        <a
                          href={`tel:${row.vendorPhone}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-mono mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{row.vendorPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Financial Amounts Strip */}
                    <div className="bg-amber-50/30 p-2.5 rounded-xl border border-amber-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">कुल बिल</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{row.totalAmount.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div className="border-x border-amber-200/60 px-1">
                        <span className="text-[10px] text-emerald-700 block font-mono">भुगतान</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{row.amountPaid.toLocaleString('hi-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 block font-mono">शेष देनदारी</span>
                        <span className={`font-mono font-bold ${isDue ? 'text-rose-600' : 'text-slate-400'}`}>
                          ₹{row.balanceDue.toLocaleString('hi-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingId(row.id)}
                        className="h-8 px-2.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 rounded-xl"
                        title="वाउचर हटाएँ"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        <span>हटाएँ</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Mobile Expense Summary Strip */}
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 uppercase font-bold">
              <span>खर्चा कुल योग ({filteredExpenses.length} वाउचर)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">कुल बिल</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{totals.total.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 block font-medium">कुल भुगतान</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{totals.paid.toLocaleString('hi-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 block font-medium">कुल देनदारी</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  ₹{totals.due.toLocaleString('hi-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* OPTION B: FULL EXPENSE SPREADSHEET TABLE (GRID VIEW)               */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                  <th className="p-3 border-r border-slate-100 font-mono">वाउचर सं०</th>
                  <th className="p-3 border-r border-slate-100">श्रेणी (Category)</th>
                  <th className="p-3 border-r border-slate-100">वेंडर / विवरण</th>
                  <th className="p-3 border-r border-slate-100">दिनांक</th>
                  <th className="p-3 border-r border-slate-100 text-right font-mono">कुल बिल</th>
                  <th className="p-3 border-r border-slate-100 text-right font-mono text-emerald-700">भुगतान</th>
                  <th className="p-3 border-r border-slate-100 text-right font-mono text-rose-600">शेष देनदारी</th>
                  <th className="p-3 border-r border-slate-100 text-center">माध्यम</th>
                  <th className="p-3 text-center">कार्यवाही</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      कोई खर्चा वाउचर नहीं मिला।
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((row, idx) => {
                    const cat = EXPENSE_CATEGORIES[row.category] || EXPENSE_CATEGORIES.misc;
                    return (
                      <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="p-3 border-r border-slate-100 font-mono font-bold text-amber-950">
                          {row.voucherNo}
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {cat.icon} {cat.labelHi}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-semibold text-slate-900">{row.vendorName}</p>
                          {row.notes && <p className="text-[11px] text-slate-500">{row.notes}</p>}
                          {row.vendorPhone && (
                            <a href={`tel:${row.vendorPhone}`} className="text-[10px] text-emerald-600 hover:underline font-mono">
                              📞 {row.vendorPhone}
                            </a>
                          )}
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-600 font-mono">{row.expenseDate}</td>
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-semibold text-slate-900">
                          ₹{row.totalAmount.toLocaleString('hi-IN')}
                        </td>
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                          ₹{row.amountPaid.toLocaleString('hi-IN')}
                        </td>
                        <td className={`p-3 border-r border-slate-100 text-right font-mono font-bold ${row.balanceDue > 0 ? 'text-rose-600 bg-rose-50/30' : 'text-slate-400'}`}>
                          ₹{row.balanceDue.toLocaleString('hi-IN')}
                        </td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(row.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50/80 text-slate-900 font-bold border-t-2 border-amber-300 text-xs">
                  <td colSpan={4} className="p-3 text-right uppercase font-mono text-amber-950">
                    खर्चा कुल योग ({filteredExpenses.length} वाउचर):
                  </td>
                  <td className="p-3 text-right font-mono text-sm">₹{totals.total.toLocaleString('hi-IN')}</td>
                  <td className="p-3 text-right font-mono text-sm text-emerald-700">₹{totals.paid.toLocaleString('hi-IN')}</td>
                  <td className="p-3 text-right font-mono text-sm text-rose-600">₹{totals.due.toLocaleString('hi-IN')}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="max-w-[92vw] sm:max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>क्या आप यह खर्चा वाउचर हटाना चाहते हैं?</AlertDialogTitle>
            <AlertDialogDescription>यह वाउचर हटाने से वित्तीय योग स्वतः पुनः गणना हो जाएगा।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">रद्द करें</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteExpense(deletingId);
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
    </div>
  );
};
