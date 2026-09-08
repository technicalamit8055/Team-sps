import React from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { DONATION_CATEGORIES, DonationCategory } from '@/types/samiti';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, Users, CheckCircle2, AlertCircle, PieChart as PieIcon, BarChart3, ArrowUpRight } from 'lucide-react';
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
    { name: 'बकाया चंदा', amount: summary.totalBalance, fill: '#ef4444' },
    { name: 'कुल खर्चा बिल', amount: summary.totalExpenses, fill: '#f97316' },
    { name: 'खर्चा भुगतान', amount: summary.expensesPaid, fill: '#06b6d4' },
    { name: 'हाथ में शुद्ध शेष', amount: Math.max(0, summary.netSurplus), fill: '#3b82f6' },
  ];

  const cashPercent = summary.totalReceived > 0 ? Math.round((summary.cashReceived / summary.totalReceived) * 100) : 0;
  const onlinePercent = 100 - cashPercent;
  const budgetProgress = currentEvent.targetBudget > 0 ? Math.min(100, Math.round((summary.totalReceived / currentEvent.targetBudget) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top 4 Hero KPIs - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">कुल स्वीकृत</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalAccepted.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground flex items-center justify-between truncate">
            <span>कुल दाता: {summary.totalDonors}</span>
            <span className="hidden xs:inline">औसत: ₹{summary.totalDonors ? Math.round(summary.totalAccepted / summary.totalDonors).toLocaleString('hi-IN') : 0}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">प्राप्त चंदा</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalReceived.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-emerald-700 flex items-center justify-between font-medium truncate">
            <span>लक्ष्य: {budgetProgress}%</span>
            <span className="hidden xs:inline font-mono">₹{currentEvent.targetBudget.toLocaleString('hi-IN')}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">बकाया चंदा</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 mt-1 sm:mt-2 font-mono">
            ₹{summary.totalBalance.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-rose-600 flex items-center justify-between truncate">
            <span>{summary.partialDonors + summary.pendingDonors} से वसूली बाकी</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">शुद्ध शेष</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2 font-mono">
            ₹{summary.netSurplus.toLocaleString('hi-IN')}
          </p>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-500 flex items-center justify-between truncate">
            <span>खर्चा काटकर संदूक शेष</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart: Overall Financial Flow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 mb-3 sm:mb-4">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            वित्तीय तुलना: चंदा, व्यय एवं शुद्ध शेष (₹ में)
          </h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString('hi-IN')}`, 'राशि']}
                  contentStyle={{ borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Collection by Sector/Category */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            श्रेणीवार चंदा संकलन (VIL / EMP / SHO / OTH)
          </h3>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs text-gray-400">कोई डेटा उपलब्ध नहीं</p>
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
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend
                    formatter={(val, entry: any) => (
                      <span className="text-xs text-gray-700">
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

      {/* Cash vs Online Breakdown Bar */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center justify-between">
          <span>भुगतान माध्यम वितरण (CASH vs UPI/ONLINE)</span>
          <span className="text-xs text-muted-foreground font-normal">
            कुल: ₹{summary.totalReceived.toLocaleString('hi-IN')}
          </span>
        </h3>

        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-amber-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
          />
          <div
            style={{ width: `${onlinePercent}%` }}
            className="bg-blue-600 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">💵 नकद (CASH in Hand): ₹{summary.cashReceived.toLocaleString('hi-IN')}</p>
              <p className="text-[11px] text-muted-foreground">{cashPercent}% • संग्रहकर्ताओं के पास / कोषाध्यक्ष संदूक</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">📲 ऑनलाइन (UPI / Bank): ₹{summary.onlineReceived.toLocaleString('hi-IN')}</p>
              <p className="text-[11px] text-muted-foreground">{onlinePercent}% • सीधे समिति बैंक खाते में</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
