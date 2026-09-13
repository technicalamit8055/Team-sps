import React, { useMemo } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { DONATION_CATEGORIES, DonationCategory, EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/samiti';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, Users, CheckCircle2, AlertCircle, PieChart as PieIcon, BarChart3, Target, Sparkles, HandCoins, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CATEGORY_COLORS: Record<DonationCategory, string> = {
  VIL: '#10b981', // emerald
  EMP: '#3b82f6', // blue
  SHO: '#f59e0b', // amber
  OTH: '#8b5cf6', // purple
};

export const FinancialOverview: React.FC = () => {
  const { currentEntity, currentEvent, donations, summary, expenses } = useSamiti();

  // Category wise breakdown for pie chart
  const categoryData = (Object.keys(DONATION_CATEGORIES) as DonationCategory[]).map(catKey => {
    const cat = DONATION_CATEGORIES[catKey];
    const catDonations = donations.filter(d => d.category === catKey);
    const total = catDonations.reduce((sum, d) => sum + (d.receivedAmount || 0), 0);
    const count = catDonations.length;
    return {
      name: cat.labelHi.split('/')[0],
      code: cat.code,
      value: total,
      count,
      color: CATEGORY_COLORS[catKey],
    };
  }).filter(c => c.value > 0);

  // Financial health bar chart comparison
  const barData = [
    { name: 'स्वीकृत चंदा', amount: summary.totalAccepted, fill: '#d97706' },
    { name: 'प्राप्त चंदा', amount: summary.totalReceived, fill: '#10b981' },
    { name: 'बकाया वसूली', amount: summary.totalBalance, fill: '#ef4444' },
    { name: 'कुल व्यय बिल', amount: summary.totalExpenses, fill: '#ea580c' },
    { name: 'व्यय भुगतान', amount: summary.expensesPaid, fill: '#0284c7' },
    { name: 'शुद्ध संदूक शेष', amount: Math.max(0, summary.netSurplus), fill: '#6366f1' },
  ];

  const cashPercent = summary.totalReceived > 0 ? Math.round((summary.cashReceived / summary.totalReceived) * 100) : 0;
  const onlinePercent = 100 - cashPercent;
  const budgetProgress = currentEvent.targetBudget > 0 ? Math.min(100, Math.round((summary.totalReceived / currentEvent.targetBudget) * 100)) : 0;
  const pledgedProgress = currentEvent.targetBudget > 0 ? Math.min(100, Math.round((summary.totalAccepted / currentEvent.targetBudget) * 100)) : 0;

  // Top Expense categories
  const expenseCatData = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + (e.totalAmount || 0);
    });

    return Object.entries(catMap)
      .map(([catKey, total]) => {
        const catInfo = EXPENSE_CATEGORIES[catKey as ExpenseCategory] || EXPENSE_CATEGORIES.misc;
        return {
          name: catInfo.labelHi.split(' ')[0],
          icon: catInfo.icon,
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Target Budget Milestone Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-700 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
              <Target className="w-3.5 h-3.5 text-amber-200" />
              <span>बजट लक्ष्य प्रगति (Budget Milestone Target)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-serif">
              {currentEvent.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90">
              लक्ष्य बजट: <strong>₹{currentEvent.targetBudget.toLocaleString('hi-IN')}</strong> • अब तक कुल संकलित:{' '}
              <strong>₹{summary.totalReceived.toLocaleString('hi-IN')}</strong> ({budgetProgress}% पूरा)
            </p>
          </div>

          <div className="text-left md:text-right w-full md:w-auto shrink-0 bg-black/20 p-3 sm:p-3.5 rounded-2xl backdrop-blur-md border border-white/20 md:min-w-[170px]">
            <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold block">
              हैंडओवर संदूक शेष
            </span>
            <span className="text-2xl font-black font-mono text-white block mt-0.5">
              ₹{summary.netSurplus.toLocaleString('hi-IN')}
            </span>
            <span className="text-[11px] text-emerald-200 block mt-0.5 font-medium">
              बकाया वसूली बाकी: ₹{summary.totalBalance.toLocaleString('hi-IN')}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-5 space-y-1.5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-white/90">
            <span>प्राप्ति: {budgetProgress}% (₹{summary.totalReceived.toLocaleString('hi-IN')})</span>
            <span>स्वीकृत संकल्प: {pledgedProgress}% (₹{summary.totalAccepted.toLocaleString('hi-IN')})</span>
            <span>लक्ष्य: ₹{currentEvent.targetBudget.toLocaleString('hi-IN')}</span>
          </div>
          <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${budgetProgress}%` }}
              className="h-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white rounded-full transition-all duration-700 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Top 4 Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">कुल स्वीकृत</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalAccepted.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground flex items-center justify-between truncate">
            <span>कुल दाता: {summary.totalDonors}</span>
            <span className="hidden xs:inline font-mono">औसत: ₹{summary.totalDonors ? Math.round(summary.totalAccepted / summary.totalDonors).toLocaleString('hi-IN') : 0}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">प्राप्त चंदा</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalReceived.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-emerald-800 flex items-center justify-between font-mono font-medium truncate">
            <span>नकद: ₹{summary.cashReceived.toLocaleString('hi-IN')}</span>
            <span>UPI: ₹{summary.onlineReceived.toLocaleString('hi-IN')}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">बकाया चंदा</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalBalance.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-rose-600 flex items-center justify-between truncate">
            <span>{summary.partialDonors + summary.pendingDonors} सहयोगियों से वसूली बाकी</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">कुल खर्च बिल</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalExpenses.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-600 flex items-center justify-between font-mono truncate">
            <span>भुगतान: ₹{summary.expensesPaid.toLocaleString('hi-IN')}</span>
            <span className="text-rose-500">देनदारी: ₹{summary.expenseBalanceDue.toLocaleString('hi-IN')}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart: Overall Financial Flow */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 mb-3 sm:mb-4">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>वित्तीय प्रवाह तुलना: चंदा, व्यय एवं शुद्ध शेष (₹ में)</span>
          </h3>
          <div className="h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString('hi-IN')}`, 'राशि']}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Collection by Category */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            <span>श्रेणीवार चंदा संकलन (VIL / EMP / SHO / OTH)</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400">कोई डेटा उपलब्ध नहीं</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toLocaleString('hi-IN')}`, 'प्राप्त']}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Legend
                    formatter={(val, entry: any) => (
                      <span className="text-xs text-slate-700">
                        {val} ({entry.payload.code}) - ₹{entry.payload.value.toLocaleString('hi-IN')}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Cash vs Online Split & Major Expense Heads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cash vs Online Breakdown Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-amber-600" />
              <span>भुगतान माध्यम वितरण (CASH vs UPI)</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              कुल: ₹{summary.totalReceived.toLocaleString('hi-IN')}
            </span>
          </h3>

          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${cashPercent}%` }}
              className="bg-amber-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
            />
            <div
              style={{ width: `${onlinePercent}%` }}
              className="bg-blue-600 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 pt-1 text-xs">
            <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60">
              <p className="font-bold text-slate-900">💵 नकद (CASH in Hand):</p>
              <p className="text-sm font-mono font-black text-amber-900 mt-1">
                ₹{summary.cashReceived.toLocaleString('hi-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {cashPercent}% • संग्रहकर्ताओं के पास / संदूक रोकड़
              </p>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-200/60">
              <p className="font-bold text-slate-900">📲 ऑनलाइन (UPI in Bank):</p>
              <p className="text-sm font-mono font-black text-blue-900 mt-1">
                ₹{summary.onlineReceived.toLocaleString('hi-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {onlinePercent}% • सीधे समिति बैंक खाते में जमा
              </p>
            </div>
          </div>
        </div>

        {/* Top Expense Categories Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>प्रमुख पूजा व्यय शीर्ष (Major Expense Heads)</span>
          </h3>

          <div className="space-y-2">
            {expenseCatData.slice(0, 4).map(cat => {
              const pct = summary.totalExpenses > 0 ? Math.round((cat.total / summary.totalExpenses) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 min-w-0">
                      <span className="shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0 whitespace-nowrap">
                      ₹{cat.total.toLocaleString('hi-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
