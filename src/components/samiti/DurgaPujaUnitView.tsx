import React, { useState, useMemo } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { useAuth } from '@/hooks/useAuth';
import { ExcelDataGrid } from './ExcelDataGrid';
import { ExpenseManager } from './ExpenseManager';
import { FinancialOverview } from './FinancialOverview';
import { ExcelImportExport } from './ExcelImportExport';
import { ChandaQRCodeModal } from './ChandaQRCodeModal';
import { DailyCashierSheetModal } from './DailyCashierSheetModal';
import { PujaScheduleModal } from './PujaScheduleModal';
import { QuickDonationDialog } from './QuickDonationDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileSpreadsheet,
  Receipt,
  BarChart3,
  DownloadCloud,
  ArrowLeft,
  Star,
  Wallet,
  TrendingUp,
  QrCode,
  Calendar,
  Sparkles,
  Crown,
  FileText,
  Phone,
  Flame,
  CheckCircle2,
  AlertCircle,
  Plus,
  Radio,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

interface DurgaPujaUnitViewProps {
  onBackToMaster?: () => void;
  isCollectorMode?: boolean;
}

export const DurgaPujaUnitView: React.FC<DurgaPujaUnitViewProps> = ({
  onBackToMaster,
  isCollectorMode: propCollectorMode,
}) => {
  const {
    entities,
    currentEntity,
    setCurrentEntityId,
    events,
    currentEvent,
    setCurrentEventId,
    summary,
    mainWorkspaceId,
    setMainWorkspaceId,
    isMainWorkspace,
    donations,
    isCollectorMode: contextCollectorMode,
    currentStaffMember,
  } = useSamiti();

  const { profile, signOut } = useAuth();
  const isCollector = propCollectorMode !== undefined ? propCollectorMode : contextCollectorMode;
  const workerName = profile?.full_name || currentStaffMember?.name || 'सुनील वर्मा';

  // Personal metrics for worker collections
  const myDonations = useMemo(() => {
    return donations.filter(d => {
      const cName = (d.collectorName || '').toLowerCase();
      const wName = workerName.toLowerCase();
      return (
        cName.includes(wName) ||
        wName.includes(cName) ||
        cName.includes('सुनील') ||
        cName.includes('कार्यकर्ता')
      );
    });
  }, [donations, workerName]);

  const myTotals = useMemo(() => {
    let totalReceived = 0;
    let totalAccepted = 0;
    let cash = 0;
    let online = 0;
    myDonations.forEach(d => {
      totalReceived += d.receivedAmount || 0;
      totalAccepted += d.acceptedAmount || 0;
      if (d.paymentMode === 'CASH') cash += d.receivedAmount || 0;
      if (d.paymentMode === 'ONL') online += d.receivedAmount || 0;
    });
    return {
      totalReceived,
      totalAccepted,
      cash,
      online,
      count: myDonations.length,
    };
  }, [myDonations]);

  const [activeTab, setActiveTab] = useState<'chanda' | 'kharcha' | 'analytics' | 'donors' | 'import_export'>('chanda');

  // Modal triggers
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCashierSheetOpen, setIsCashierSheetOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const isMain = isMainWorkspace(currentEntity.id);

  // Top Donors / VIP Patrons (sorted by accepted amount descending)
  const topDonors = [...donations]
    .sort((a, b) => (b.acceptedAmount || 0) - (a.acceptedAmount || 0))
    .slice(0, 10);

  const budgetProgress = currentEvent.targetBudget > 0
    ? Math.min(100, Math.round((summary.totalReceived / currentEvent.targetBudget) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/5 via-background to-rose-500/5 text-foreground pb-20">
      {/* ------------------------------------------------------------- */}
      {/* FESTIVE SACRED TOP BAR                                        */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-rose-950 via-amber-950 to-slate-950 text-white border-b border-amber-500/30 shadow-xl">
        {/* Top Accent Strip */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-rose-500" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Back to Master (Hidden for Collector) & Entity Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {!isCollector && onBackToMaster && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToMaster}
                  className="text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 shrink-0 h-8 px-2.5 rounded-xl transition-all"
                  title="Return to Master OS Central Command"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden xs:inline">Master OS</span>
                </Button>
                <span className="text-white/20 hidden sm:inline">|</span>
              </>
            )}

            {/* Puja Deity & Name Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center text-white text-base font-serif shadow-md shrink-0 ring-1 ring-amber-300/40">
                🪔
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5 truncate">
                  <h1 className="text-xs sm:text-sm font-extrabold text-white truncate font-serif">
                    {currentEntity.name}
                  </h1>
                  {isCollector ? (
                    <Badge className="bg-amber-500 text-slate-950 text-[9px] font-black shrink-0 inline-flex items-center gap-0.5 py-0 px-1.5 rounded-full border-none">
                      चंदा संग्रह पोर्टल
                    </Badge>
                  ) : (
                    isMain && (
                      <Badge className="bg-amber-500 text-slate-950 text-[9px] font-black shrink-0 hidden md:inline-flex items-center gap-0.5 py-0 px-1.5 rounded-full border-none">
                        <Star className="w-2.5 h-2.5 fill-slate-950" />
                        Main
                      </Badge>
                    )
                  )}
                </div>
                <p className="text-[10px] text-amber-200/80 truncate hidden sm:block">
                  📍 {currentEntity.location || 'नारायणपुर'} • {currentEvent.title}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Instant QR Code Button */}
            <Button
              size="sm"
              onClick={() => setIsQRModalOpen(true)}
              className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-2.5 sm:px-3 rounded-xl shadow-md transition-transform active:scale-95"
              title="चंदा हेतु UPI QR कोड खोलें"
            >
              <QrCode className="w-3.5 h-3.5 sm:mr-1.5 text-slate-950" />
              <span className="hidden sm:inline">त्वरित QR कोड</span>
            </Button>

            {isCollector ? (
              <>
                {/* Logged in Collector Badge */}
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-xl">
                  <User className="w-3 h-3 text-amber-300" />
                  <span className="text-[10px] text-amber-200 font-medium hidden xs:inline">संग्रहकर्ता:</span>
                  <span className="text-xs font-black text-white truncate max-w-[120px]">{workerName}</span>
                </div>

                {/* Logout Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => signOut()}
                  className="h-8 text-xs bg-rose-600/30 hover:bg-rose-600/50 text-white border-rose-400/40 px-2.5 rounded-xl transition-all"
                  title="लॉगआउट करें"
                >
                  <LogOut className="w-3.5 h-3.5 sm:mr-1 text-rose-200" />
                  <span className="hidden sm:inline">लॉगआउट</span>
                </Button>
              </>
            ) : (
              <>
                {/* Daily Cashier Sheet Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCashierSheetOpen(true)}
                  className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 px-2 sm:px-2.5 rounded-xl hidden md:inline-flex items-center gap-1.5"
                  title="दैनिक रोकड़ पर्ची व कोषाध्यक्ष मिलान"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>रोकड़ पर्ची</span>
                </Button>

                {/* Puja Schedule Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(true)}
                  className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 px-2 sm:px-2.5 rounded-xl hidden lg:inline-flex items-center gap-1.5"
                  title="9 दिवसीय नवरात्र पूजा समय-सारणी"
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-300" />
                  <span>पूजा पंचांग</span>
                </Button>

                {/* Net Surplus Capsule */}
                <div className="text-right bg-white/10 px-2.5 py-1 rounded-xl border border-white/15 hidden sm:block">
                  <span className="text-[8px] text-white/60 block uppercase font-bold tracking-wider">
                    संदूक शेष
                  </span>
                  <span className="text-xs font-black font-mono text-emerald-300">
                    ₹{summary.netSurplus.toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN BODY                                                     */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Festive Welcome & Panchang Status Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-amber-900 to-rose-950 text-white rounded-3xl p-4 sm:p-6 shadow-lg border border-amber-400/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold inline-flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                  श्री दुर्गा पूजा महोत्सव 2026 • 41वाँ वार्षिकोत्सव
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-medium hidden sm:inline-block">
                  शारदीय नवरात्र: 15 अक्टूबर से 24 अक्टूबर 2026
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white font-serif tracking-wide">
                {isCollector
                  ? 'माँ भगवती कृपा • अधिकृत चंदा संग्रह एवं पावती रसीद पोर्टल'
                  : 'माँ भगवती कृपा एवं चंदा-व्यय डिजिटल प्रबंधन प्रणाली'}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/90 font-serif italic max-w-2xl">
                "{currentEntity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।'}"
              </p>
            </div>

            {/* Quick Actions Strip inside Hero */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isCollector && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsScheduleOpen(true)}
                    className="h-8 text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1 text-amber-300" />
                    <span>पूजा कार्यक्रम</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setIsCashierSheetOpen(true)}
                    className="h-8 text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                    <span>दैनिक रोकड़ पर्ची</span>
                  </Button>
                </>
              )}

              {isCollector && (
                <Button
                  size="sm"
                  onClick={() => setIsQRModalOpen(true)}
                  className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-bold"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  <span>त्वरित UPI QR</span>
                </Button>
              )}

              <QuickDonationDialog
                isCollectorMode={isCollector}
                defaultCollectorName={workerName}
                triggerButton={
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all border border-amber-300"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-slate-950 stroke-[2.5]" />
                    <span>+ नई चंदा प्रविष्टि</span>
                  </Button>
                }
              />
            </div>
          </div>

          {/* Target Budget Milestone Progress (Hidden for Collector) */}
          {!isCollector && (
            <div className="mt-4 pt-3 border-t border-white/15 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-white/90">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>संकलन लक्ष्य प्रगति: {budgetProgress}% प्राप्त</span>
                </span>
                <span className="font-mono text-amber-200">
                  ₹{summary.totalReceived.toLocaleString('hi-IN')} / ₹{currentEvent.targetBudget.toLocaleString('hi-IN')}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
                <div
                  style={{ width: `${budgetProgress}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 rounded-full transition-all duration-700 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLLECTOR MODE: PERSONAL METRIC STRIP & DIRECT CHANDA GRID     */}
        {/* ------------------------------------------------------------- */}
        {isCollector ? (
          <div className="space-y-5">
            {/* 4 Collector Personal Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: My Collections */}
              <div className="bg-white border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                    मेरे द्वारा संकलित चंदा
                  </span>
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1 font-mono">
                  ₹{myTotals.totalReceived.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-slate-600 mt-1 flex justify-between font-mono">
                  <span>नकद: ₹{myTotals.cash.toLocaleString('hi-IN')}</span>
                  <span className="text-blue-700 font-bold">UPI: ₹{myTotals.online.toLocaleString('hi-IN')}</span>
                </div>
              </div>

              {/* Card 2: My Total Receipts */}
              <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                    कुल जारी रसीदें
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono">
                  {myTotals.count} रसीदें
                </p>
                <div className="text-[10px] sm:text-[11px] text-slate-600 mt-1 truncate">
                  स्वीकृत संकल्प: ₹{myTotals.totalAccepted.toLocaleString('hi-IN')}
                </div>
              </div>

              {/* Card 3: Instant QR Modal Trigger */}
              <div
                onClick={() => setIsQRModalOpen(true)}
                className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                    समिति UPI QR कोड
                  </span>
                  <QrCode className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-slate-900 mt-1">
                    📲 ऑन-स्पॉट डिजिटल भुगतान
                  </p>
                  <p className="text-[10px] text-amber-800/80 mt-0.5">
                    दाता से फोनपे/गूगलपे स्कैन करवाएँ →
                  </p>
                </div>
              </div>

              {/* Card 4: Direct Add Donation Action Card */}
              <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-rose-600 text-white rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                    नई प्रविष्टि दर्ज करें
                  </span>
                  <Plus className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <div className="mt-2">
                  <QuickDonationDialog
                    isCollectorMode={true}
                    defaultCollectorName={workerName}
                    triggerButton={
                      <Button
                        size="sm"
                        className="w-full bg-white hover:bg-amber-50 text-slate-950 font-black text-xs h-8 rounded-xl shadow-xs border-none"
                      >
                        + नया चंदा जोड़ें
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Direct Donation Register Grid (Zero Tabs, Zero Financial Dashboard) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      चंदा संग्रह रजिस्टर (Donation Entries)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      प्रविष्टियाँ जोड़ें एवं तुरंत व्हाट्सएप डिजिटल रसीद प्रदान करें
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs px-2.5 py-0.5">
                  अधिकृत संग्रहकर्ता
                </Badge>
              </div>

              <ExcelDataGrid isCollectorMode={true} collectorName={workerName} />
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* ADMIN / MANAGER FULL WORKSPACE VIEW WITH FINANCIALS & TABS     */
          /* ------------------------------------------------------------- */
          <>
            {/* 5 FESTIVE KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {/* Card 1: Pledged Funds */}
              <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    स्वीकृत चंदा (Pledged)
                  </span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                  ₹{summary.totalAccepted.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                  कुल दाता: <strong className="text-slate-800">{summary.totalDonors}</strong>
                </div>
              </div>

              {/* Card 2: Received Funds */}
              <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                    प्राप्त चंदा (Received)
                  </span>
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1 font-mono">
                  ₹{summary.totalReceived.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-slate-600 mt-1 flex justify-between font-mono">
                  <span>नकद: ₹{summary.cashReceived.toLocaleString('hi-IN')}</span>
                  <span className="text-blue-700 font-bold">UPI: ₹{summary.onlineReceived.toLocaleString('hi-IN')}</span>
                </div>
              </div>

              {/* Card 3: Pending Balance */}
              <div className="bg-white border border-rose-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider font-mono">
                    बकाया वसूली (Due)
                  </span>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-rose-600 mt-1 font-mono">
                  ₹{summary.totalBalance.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-rose-600 mt-1 truncate font-medium">
                  {summary.pendingDonors + summary.partialDonors} दाताओं से वसूली बाकी
                </div>
              </div>

              {/* Card 4: Total Expenses */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                    पंडाल व पूजा व्यय
                  </span>
                  <Receipt className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                  ₹{summary.totalExpenses.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex justify-between font-mono">
                  <span>भुगतान: ₹{summary.expensesPaid.toLocaleString('hi-IN')}</span>
                  <span className="text-rose-500 font-semibold">देनदारी: ₹{summary.expenseBalanceDue.toLocaleString('hi-IN')}</span>
                </div>
              </div>

              {/* Card 5: Net Reserve In Treasury */}
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                    संदूक शुद्ध शेष
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                </div>
                <p className="text-lg sm:text-2xl font-black text-amber-950 mt-1 font-mono">
                  ₹{summary.netSurplus.toLocaleString('hi-IN')}
                </p>
                <div className="text-[10px] sm:text-[11px] text-amber-800/80 mt-1 font-medium">
                  खर्च भुगतान बाद खजाना शेष
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <TabsList className="bg-amber-100/60 p-1 border border-amber-200/80 h-10 rounded-2xl overflow-x-auto no-scrollbar">
                  <TabsTrigger
                    value="chanda"
                    className="text-xs font-bold px-3 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white shadow-none transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    चंदा रजिस्टर (11 कॉलम)
                  </TabsTrigger>
                  <TabsTrigger
                    value="kharcha"
                    className="text-xs font-bold px-3 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white shadow-none transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5 mr-1.5" />
                    पंडाल व पूजा खर्च
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="text-xs font-bold px-3 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white shadow-none transition-all"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    वित्तीय लेखा-जोखा
                  </TabsTrigger>
                  <TabsTrigger
                    value="donors"
                    className="text-xs font-bold px-3 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white shadow-none transition-all"
                  >
                    <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                    दानवीर सूची (VIP Patrons)
                  </TabsTrigger>
                  <TabsTrigger
                    value="import_export"
                    className="text-xs font-bold px-3 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white shadow-none transition-all"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                    इम्पोर्ट / एक्सपोर्ट
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: CHANDA LEDGER */}
              <TabsContent value="chanda" className="m-0 focus-visible:outline-none">
                <ExcelDataGrid isCollectorMode={false} />
              </TabsContent>

              {/* TAB 2: EXPENSES */}
              <TabsContent value="kharcha" className="m-0 focus-visible:outline-none">
                <ExpenseManager />
              </TabsContent>

              {/* TAB 3: FINANCIAL OVERVIEW */}
              <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
                <FinancialOverview />
              </TabsContent>

              {/* TAB 4: TOP DONORS HALL OF FAME */}
              <TabsContent value="donors" className="m-0 focus-visible:outline-none space-y-4">
                <div className="bg-white border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span>प्रमुख दानदाता एवं भामाशाह सूची (Top Patrons Leaderboard)</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        माँ दुर्गा पूजा महोत्सव में उत्कृष्ट आर्थिक सहयोग प्रदान करने वाले महानुभाव
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs px-3 py-1 font-bold">
                      कुल शीर्ष सहयोगी: {topDonors.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topDonors.map((donor, idx) => {
                      const isRank1 = idx === 0;
                      const isRank2 = idx === 1;
                      const isRank3 = idx === 2;

                      return (
                        <div
                          key={donor.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isRank1
                              ? 'bg-gradient-to-r from-amber-100/70 to-yellow-50 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                              : isRank2
                                ? 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300 shadow-2xs'
                                : isRank3
                                  ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/40 border-amber-200'
                                  : 'bg-white border-slate-200'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${isRank1
                                  ? 'bg-amber-500 text-white'
                                  : isRank2
                                    ? 'bg-slate-400 text-white'
                                    : isRank3
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-slate-100 text-slate-700 font-mono'
                                }`}
                            >
                              {isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : `#${idx + 1}`}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {donor.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {donor.identity || donor.address1 || 'नारायणपुर'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-sm sm:text-base text-amber-950 block">
                              ₹{donor.acceptedAmount.toLocaleString('hi-IN')}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 block mt-0.5">
                              प्राप्त: ₹{donor.receivedAmount.toLocaleString('hi-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 5: IMPORT / EXPORT */}
              <TabsContent value="import_export" className="m-0 focus-visible:outline-none">
                <ExcelImportExport />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODALS                                                        */}
      {/* ------------------------------------------------------------- */}
      {/* 1. On-spot UPI QR Code Modal */}
      <ChandaQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* 2. Daily Cashier Handover Sheet Modal (Admin/Manager only) */}
      {!isCollector && (
        <DailyCashierSheetModal
          isOpen={isCashierSheetOpen}
          onClose={() => setIsCashierSheetOpen(false)}
        />
      )}

      {/* 3. Puja Schedule & Committee Modal (Admin/Manager only) */}
      {!isCollector && (
        <PujaScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
        />
      )}
    </div>
  );
};

export default DurgaPujaUnitView;
