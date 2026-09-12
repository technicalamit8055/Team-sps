import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSamiti } from '@/contexts/SamitiContext';
import { useAuth } from '@/hooks/useAuth';
import { ExcelDataGrid } from './ExcelDataGrid';
import { ExpenseManager } from './ExpenseManager';
import { FinancialOverview } from './FinancialOverview';
import { ExcelImportExport } from './ExcelImportExport';
import { ChandaQRCodeModal } from './ChandaQRCodeModal';
import { DailyCashierSheetModal } from './DailyCashierSheetModal';
import { QuickDonationDialog } from './QuickDonationDialog';
import { DurgaPujaSettingsModal } from './DurgaPujaSettingsModal';
import { DurgaPujaSidebar } from './DurgaPujaSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  FileSpreadsheet,
  Receipt,
  BarChart3,
  DownloadCloud,
  ArrowLeft,
  Crown,
  FileText,
  CheckCircle2,
  Hourglass,
  Coins,
  QrCode,
  Calendar,
  Sparkles,
  Plus,
  Bell,
  Settings,
  Pencil,
  Menu,
  Users,
  LogOut,
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
    summary,
    mainWorkspaceId,
    isMainWorkspace,
    donations,
    isCollectorMode: contextCollectorMode,
    currentStaffMember,
  } = useSamiti();

  const navigate = useNavigate();
  const { profile, signOut, role } = useAuth();
  const isCollector = propCollectorMode !== undefined ? propCollectorMode : contextCollectorMode;
  const workerName = profile?.full_name || currentStaffMember?.name || 'सुनील वर्मा';

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (e) {
      console.error('Logout error:', e);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
    }
  };

  // Personal metrics for worker collections
  const myDonations = useMemo(() => {
    // Exact (trimmed, case-insensitive) match on the collector name. Loose
    // substring matching plus hardcoded demo names previously credited other
    // collectors' entries to whoever was logged in.
    const wName = workerName.trim().toLowerCase();
    return donations.filter(d => {
      const cName = (d.collectorName || '').trim().toLowerCase();
      return !!cName && cName === wName;
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

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCashierSheetOpen, setIsCashierSheetOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'header' | 'reset'>('header');
  const [isQuickDonationOpen, setIsQuickDonationOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Top Donors (VIP Patrons)
  const topDonors = [...donations]
    .sort((a, b) => (b.acceptedAmount || 0) - (a.acceptedAmount || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-slate-900 flex flex-col font-sans selection:bg-rose-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP MAROON NAVBAR (Exact match to reference mockup)         */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#3c050d] via-[#2d0309] to-[#3c050d] text-white border-b border-[#63101c] shadow-lg">
        {/* Top Sacred Accent Line */}
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-rose-500" />

        <div className="w-full px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Hamburger (mobile), Sacred Emblem, Title & Location */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Sidebar Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 border border-white/20"
              title="मेनू खोलें"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Back to Master OS if available */}
            {!isCollector && onBackToMaster && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToMaster}
                className="text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 shrink-0 h-8 px-2.5 rounded-xl transition-all hidden sm:inline-flex items-center"
                title="Master OS में लौटें"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Master OS</span>
              </Button>
            )}

            {/* Sacred Trishul & Om Crest */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 p-0.5 shadow-md shrink-0">
              <img
                src="/images/durga/sacred-trishul-om.jpg"
                alt="Trishul Om"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-sm sm:text-base font-extrabold text-white font-serif tracking-wide truncate">
                  {currentEntity.name || 'श्री दुर्गा पूजा समिति, नारायणपुर'}
                </h1>
                {!isCollector && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDefaultTab('header');
                      setIsSettingsModalOpen(true);
                    }}
                    className="text-amber-300/80 hover:text-amber-100 p-0.5 rounded transition-colors"
                    title="शीर्षक व समिति विवरण संपादित करें"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-amber-200/90 font-serif truncate">
                📍 {currentEntity.location || 'मुख्य चौक, नारायणपुर'} • स्थापना वर्ष: 1985
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons & Total Collections Box */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors hidden sm:inline-flex"
              title="सूचनाएँ"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#2d0309]" />
            </button>

            {/* Instant QR Code Button */}
            <Button
              size="sm"
              onClick={() => setIsQRModalOpen(true)}
              className="h-8 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-2.5 sm:px-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              title="त्वरित QR कोड खोलें"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden xs:inline font-serif">त्वरित QR कोड</span>
            </Button>

            {/* Daily Cashier Receipt Button */}
            {!isCollector && (
              <Button
                size="sm"
                onClick={() => setIsCashierSheetOpen(true)}
                className="h-8 text-xs bg-[#5a0c17] hover:bg-[#720e1c] text-white border border-[#8a1423] font-medium px-2.5 sm:px-3 rounded-xl hidden md:inline-flex items-center gap-1.5 transition-all"
                title="दैनिक चंदा पर्ची व रोकड़ रजिस्टर"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-serif">दैनिक चंदा पर्ची</span>
              </Button>
            )}

            {/* Settings Button */}
            {!isCollector && (
              <Button
                size="sm"
                onClick={() => {
                  setSettingsDefaultTab('header');
                  setIsSettingsModalOpen(true);
                }}
                className="h-8 text-xs bg-[#5a0c17] hover:bg-[#720e1c] text-white border border-[#8a1423] font-medium px-2.5 sm:px-3 rounded-xl hidden sm:inline-flex items-center gap-1.5 transition-all"
                title="समिति सेटिंग्स"
              >
                <Settings className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-serif">सेटिंग्स</span>
              </Button>
            )}

            {/* Total Collection Pill with Glowing Lotus Badge */}
            <div className="flex items-center gap-2 bg-[#250308] border border-[#6b1420] px-3 py-1 rounded-xl shadow-inner">
              <div className="text-right">
                <span className="text-[8px] text-amber-200/70 block uppercase font-bold tracking-wider">
                  कुल संग्रह
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                  ₹{summary.totalReceived.toLocaleString('hi-IN')}
                </span>
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-rose-950/80 p-0.5 ring-1 ring-amber-400/50 shrink-0">
                <img
                  src="/images/durga/sacred-lotus.jpg"
                  alt="Lotus"
                  className="w-full h-full object-cover rounded-full filter drop-shadow"
                />
              </div>
            </div>

            {/* सिर्फ एक स्थान पर हिंदी में लॉगआउट विकल्प */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="h-8 text-xs bg-[#520914] hover:bg-[#6e0d1c] text-rose-200 hover:text-white border border-rose-600/60 hover:border-rose-400 font-serif font-bold px-3 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              title="खाता लॉगआउट करें"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span className="font-serif">लॉगआउट</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. BODY WITH SIDEBAR, MAIN CONTENT & RIGHT SACRED STRIP        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Sidebar */}
        <div className="hidden lg:block">
          <DurgaPujaSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenAddDonation={() => setIsQuickDonationOpen(true)}
            onOpenQR={() => setIsQRModalOpen(true)}
            onOpenCashierSheet={() => setIsCashierSheetOpen(true)}
            onOpenSettings={() => {
              setSettingsDefaultTab('header');
              setIsSettingsModalOpen(true);
            }}
            onOpenSeva={() => setIsCashierSheetOpen(true)}
            isCollector={isCollector}
            workerName={workerName}
          />
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 max-w-[240px] z-10 animate-in slide-in-from-left duration-300">
              <DurgaPujaSidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onOpenAddDonation={() => setIsQuickDonationOpen(true)}
                onOpenQR={() => setIsQRModalOpen(true)}
                onOpenCashierSheet={() => setIsCashierSheetOpen(true)}
                onOpenSettings={() => {
                  setSettingsDefaultTab('header');
                  setIsSettingsModalOpen(true);
                }}
                onOpenSeva={() => setIsCashierSheetOpen(true)}
                isCollector={isCollector}
                workerName={workerName}
                onCloseMobileDrawer={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Center Stage */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4">
          {/* ----------------------------------------------------------- */}
          {/* A. GRAND FESTIVE HERO BANNER (Maa Durga Lion + Temple Arch)   */}
          {/* ----------------------------------------------------------- */}
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/60 shadow-xl min-h-[220px] sm:min-h-[260px] flex items-center">
            {/* Background Art Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('/images/durga/durga-banner-bg.jpg')` }}
            />

            {/* Subtle soft gradient overlay so text remains readable in center */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-amber-50/70 to-amber-900/20" />

            {/* Hero Banner Content Layer */}
            <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left spacer for Goddess Durga on Lion artwork */}
              <div className="hidden lg:block w-48 shrink-0" />

              {/* Center: Majestic Typography & Call to Actions */}
              <div className="text-center flex-1 max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-serif text-[#480911] tracking-wide drop-shadow-xs">
                  {currentEntity.name || 'श्री दुर्गा पूजा समिति, नारायणपुर'}
                </h2>

                <p className="text-xs sm:text-base font-extrabold font-serif text-amber-950">
                  {currentEntity.bannerBadgeText || 'श्री दुर्गा पूजा महोत्सव 2026 (भव्य 41वाँ वार्षिकोत्सव)'}
                </p>

                <p className="text-[11px] sm:text-sm font-serif italic text-slate-800 max-w-md mx-auto">
                  "{currentEntity.tagline || 'माँ दुर्गा की असीम कृपा आप और आपके परिवार पर सदा बनी रहे।'}"
                </p>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsQuickDonationOpen(true)}
                    className="h-9 sm:h-10 px-5 rounded-full bg-gradient-to-r from-[#cf1d32] to-[#990e1f] hover:from-[#b91527] hover:to-[#830a18] text-white font-serif font-bold text-xs sm:text-sm shadow-lg shadow-rose-900/40 border border-rose-400/40 flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ नया चंदा जोड़ें</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('chanda')}
                    className="h-9 sm:h-10 px-4 rounded-full bg-[#faedd2]/90 hover:bg-[#faedd2] text-amber-950 border border-amber-500/60 font-serif font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all hover:border-amber-600"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-800" />
                    <span>चंदा रजिस्टर देखें</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Festival Dates Badge, Year & Calligraphy */}
              <div className="hidden md:flex flex-col items-end gap-2 text-right shrink-0">
                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs border border-amber-300 px-3 py-1 rounded-full shadow-xs text-[10px] sm:text-xs font-serif font-bold text-amber-950">
                  <Calendar className="w-3 h-3 text-rose-600" />
                  <span>भारत का नवरात्र: 15 अक्टूबर से 24 अक्टूबर 2026</span>
                </div>

                <Badge className="bg-[#480911] text-amber-200 border border-amber-400/40 font-mono text-[10px] px-2 py-0.5 rounded-md">
                  2026 - 27
                </Badge>

                {/* Calligraphy Callout: शक्ति, भक्ति, एकता */}
                <div className="font-serif font-black text-xs sm:text-sm text-amber-950/90 tracking-widest leading-snug pr-1">
                  <div>शक्ति</div>
                  <div>भक्ति</div>
                  <div>एकता</div>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* B. 5 PASTEL KPI METRIC CARDS (Exact match to reference)      */}
          {/* ----------------------------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card 1: Pledged Funds (Warm Cream / Gold) */}
            <div className="bg-[#fff9ec] border border-[#f0dcaf] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fdeecf] border border-[#e8ce94] flex items-center justify-center text-amber-700 shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    स्वीकृत चंदा <span className="font-mono text-[8px]">(PLEDGED)</span>
                  </span>
                  <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
                    ₹{summary.totalAccepted.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 font-serif">
                कुल दानदाता: <strong className="text-slate-700">{summary.totalDonors}</strong>
              </div>
            </div>

            {/* Card 2: Received Funds (Mint / Cream) */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#dcfce7] border border-[#86efac] flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    प्राप्त चंदा <span className="font-mono text-[8px]">(RECEIVED)</span>
                  </span>
                  <p className="text-base sm:text-xl font-black text-emerald-700 mt-0.5 font-mono">
                    ₹{summary.totalReceived.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 mt-2 flex justify-between font-mono">
                <span>नकद: ₹{summary.cashReceived.toLocaleString('hi-IN')}</span>
                <span className="text-blue-700 font-bold">UPI: ₹{summary.onlineReceived.toLocaleString('hi-IN')}</span>
              </div>
            </div>

            {/* Card 3: Pending Balance (Pale Rose / Cream) */}
            <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ffe4e6] border border-[#fda4af] flex items-center justify-center text-rose-500 shrink-0">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                    बकाया राशि <span className="font-mono text-[8px]">(DUE)</span>
                  </span>
                  <p className="text-base sm:text-xl font-black text-rose-600 mt-0.5 font-mono">
                    ₹{summary.totalBalance.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-rose-600/90 mt-2 font-serif truncate">
                {summary.pendingDonors + summary.partialDonors} दाताओं से बकाया बाकी
              </div>
            </div>

            {/* Card 4: Total Expenses (Sky Blue / Cream) */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#7dd3fc] flex items-center justify-center text-sky-600 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    पंडाल व पूजा व्यय
                  </span>
                  <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
                    ₹{summary.totalExpenses.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex justify-between font-mono">
                <span>भुगतान: ₹{summary.expensesPaid.toLocaleString('hi-IN')}</span>
                <span className="text-rose-500 font-semibold">देनदारी: ₹{summary.expenseBalanceDue.toLocaleString('hi-IN')}</span>
              </div>
            </div>

            {/* Card 5: Net Surplus / Active Participation (Amber / Cream) */}
            <div className="col-span-2 sm:col-span-1 bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fef3c7] border border-[#fcd34d] flex items-center justify-center text-amber-700 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    सक्रिय चंदा-सहयोग
                  </span>
                  <p className="text-base sm:text-xl font-black text-amber-950 mt-0.5 font-mono">
                    ₹{summary.netSurplus.toLocaleString('hi-IN')}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-amber-800/80 mt-2 font-serif truncate">
                सर्व भुगतान बाद लगाना होई
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* C. NAVIGATION TABS RIBBON & SANSKRIT BLESSING MOTIF           */}
          {/* ----------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
            {/* Horizontal Tabs Pill Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('chanda')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'chanda'
                    ? 'bg-[#7a121d] text-white shadow-md shadow-rose-950/30 ring-1 ring-amber-400/40'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>चंदा रजिस्टर (11 कॉलम)</span>
              </button>

              {!isCollector && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kharcha')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'kharcha'
                        ? 'bg-[#7a121d] text-white shadow-md shadow-rose-950/30 ring-1 ring-amber-400/40'
                        : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>पंडाल व पूजा व्यय</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'analytics'
                        ? 'bg-[#7a121d] text-white shadow-md shadow-rose-950/30 ring-1 ring-amber-400/40'
                        : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>वित्तीय लेखा-जोखा</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('donors')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'donors'
                    ? 'bg-[#7a121d] text-white shadow-md shadow-rose-950/30 ring-1 ring-amber-400/40'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>दानवीर सूची (VIP Patrons)</span>
              </button>

              {!isCollector && (
                <button
                  type="button"
                  onClick={() => setActiveTab('import_export')}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'import_export'
                      ? 'bg-[#7a121d] text-white shadow-md shadow-rose-950/30 ring-1 ring-amber-400/40'
                      : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>इम्पोर्ट / एक्सपोर्ट</span>
                </button>
              )}
            </div>

            {/* Right Sanskrit Shloka Flourish: सर्वे भवन्तु सुखिनः */}
            <div className="hidden md:flex items-center gap-2 text-amber-900/80 font-serif font-bold text-xs shrink-0 pr-2">
              <span className="text-amber-500 text-sm">❧</span>
              <span className="tracking-wide">· सर्वे भवन्तु सुखिनः ·</span>
              <span className="text-amber-500 text-sm">☙</span>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* D. TAB CONTENTS                                             */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'chanda' && (
            <ExcelDataGrid
              isCollectorMode={isCollector}
              collectorName={workerName}
              onOpenNewDonationModal={() => setIsQuickDonationOpen(true)}
            />
          )}

          {activeTab === 'kharcha' && !isCollector && (
            <ExpenseManager />
          )}

          {activeTab === 'analytics' && !isCollector && (
            <FinancialOverview />
          )}

          {activeTab === 'donors' && (
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
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isRank1
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
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                            isRank1
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
          )}

          {activeTab === 'import_export' && !isCollector && (
            <ExcelImportExport />
          )}
        </main>

        {/* ----------------------------------------------------------- */}
        {/* 3. RIGHT SACRED VERTICAL STRIP & GOLDEN DIYA LAMP (Desktop)  */}
        {/* ----------------------------------------------------------- */}
        <aside className="hidden xl:flex w-14 shrink-0 flex-col items-center justify-between py-6 px-1 border-l border-amber-300/80 bg-[#fffbf2] select-none text-center">
          {/* Top Traditional Motif */}
          <div className="text-amber-600 text-sm">🪔</div>

          {/* Sacred Vertical Calligraphy: माँ दुर्गा की कृपा सदा आपके साथ रहे। */}
          <div className="flex flex-col items-center gap-1 font-serif font-black text-xs text-amber-950/90 leading-tight">
            <span>माँ</span>
            <span>दुर्गा</span>
            <span>की</span>
            <span>कृपा</span>
            <span>सदा</span>
            <span>आपके</span>
            <span>साथ</span>
            <span>रहे।</span>
          </div>

          {/* Bottom Glowing Golden Diya */}
          <div className="relative group cursor-pointer" title="शुभ दीपावली व नवरात्र ज्योति">
            <div className="w-10 h-10 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-md ring-2 ring-amber-400/50">
              <img
                src="/images/durga/golden-diya.jpg"
                alt="Golden Diya"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODALS (Quick Donation, QR, Cashier Sheet, Settings)        */}
      {/* ------------------------------------------------------------- */}
      {/* Quick Donation Modal */}
      <QuickDonationDialog
        isCollectorMode={isCollector}
        defaultCollectorName={workerName}
        open={isQuickDonationOpen}
        onOpenChange={setIsQuickDonationOpen}
      />

      {/* Instant QR Modal */}
      <ChandaQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Daily Cashier Sheet Modal */}
      {!isCollector && (
        <DailyCashierSheetModal
          isOpen={isCashierSheetOpen}
          onClose={() => setIsCashierSheetOpen(false)}
        />
      )}

      {/* Durga Puja Settings Modal */}
      {!isCollector && (
        <DurgaPujaSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          defaultTab={settingsDefaultTab}
        />
      )}

      {/* लॉगआउट पुष्टि संवाद (केवल हिंदी में) */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent className="bg-[#fffcf7] border border-amber-300 sm:rounded-2xl max-w-md shadow-2xl">
          <AlertDialogHeader className="text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center mx-auto sm:mx-0 shadow-xs">
              <LogOut className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold font-serif text-[#480911]">
              लॉगआउट की पुष्टि
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
              क्या आप निश्चित रूप से अपने संग्रहकर्ता खाते {workerName ? `(${workerName})` : ''} से लॉगआउट करना चाहते हैं? आपकी सभी प्रविष्टियाँ सुरक्षित हैं।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t border-amber-100">
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="h-9 text-xs rounded-xl font-serif font-medium border-slate-300 hover:bg-slate-100 mt-0"
            >
              रद्द करें
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-9 text-xs rounded-xl font-serif font-bold bg-gradient-to-r from-[#cf1d32] to-[#990e1f] hover:from-[#b91527] hover:to-[#830a18] text-white shadow-md shadow-rose-900/30 gap-1.5 border border-rose-400/30"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>लॉगआउट हो रहा है...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>लॉगआउट करें</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DurgaPujaUnitView;
