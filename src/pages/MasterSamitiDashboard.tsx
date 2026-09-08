import React, { useState } from 'react';
import { SamitiProvider, useSamiti } from '@/contexts/SamitiContext';
import { ExcelDataGrid } from '@/components/samiti/ExcelDataGrid';
import { ExpenseManager } from '@/components/samiti/ExpenseManager';
import { FinancialOverview } from '@/components/samiti/FinancialOverview';
import { ExcelImportExport } from '@/components/samiti/ExcelImportExport';
import VictoryApp from '@/pages/Index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileSpreadsheet,
  Receipt,
  BarChart3,
  DownloadCloud,
  ArrowLeft,
  Sparkles,
  Plus,
  Maximize2,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const MasterSamitiDashboardContent: React.FC = () => {
  const {
    entities,
    currentEntity,
    setCurrentEntityId,
    currentEvent,
    summary,
    addEntity,
    resetToSampleData,
  } = useSamiti();

  // null = Executive Portal view; string = active dedicated workspace view
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chanda' | 'kharcha' | 'analytics' | 'import_export'>('chanda');

  // Create entity modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'festival_samiti' | 'election' | 'business' | 'rwa'>('festival_samiti');
  const [newUpi, setNewUpi] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newBudget, setNewBudget] = useState('300000');

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEventTitle.trim()) return;

    addEntity(
      {
        name: newName.trim(),
        type: newType,
        upiId: newUpi.trim() || 'samiti@upi',
        tagline: newTagline.trim() || 'सर्वजन हिताय, सर्वजन सुखाय',
        location: newLocation.trim() || 'मुख्य केंद्र',
        establishedYear: new Date().getFullYear(),
      },
      {
        title: newEventTitle.trim(),
        fiscalYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
        targetBudget: parseFloat(newBudget) || 0,
        isActive: true,
      }
    );

    setNewName('');
    setNewEventTitle('');
    setNewUpi('');
    setNewTagline('');
    setNewLocation('');
    setIsCreateOpen(false);
  };

  const openWorkspace = (entityId: string) => {
    setCurrentEntityId(entityId);
    setActiveWorkspaceId(entityId);
  };

  // -------------------------------------------------------------
  // VIEW 1: DEDICATED FULL-SCREEN ELECTION MANAGEMENT WORKSPACE
  // -------------------------------------------------------------
  if (activeWorkspaceId && currentEntity.type === 'election') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sleek, Minimalist Master Hub Top Bar */}
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-3 sm:px-6 lg:px-8 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-3 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setActiveWorkspaceId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors border border-slate-700 shrink-0"
              title="मुख्य पोर्टल पर वापस जाएँ"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">मुख्य पोर्टल</span>
            </button>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-white truncate">
                🗳️ {currentEntity.name}
              </span>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px] font-bold shrink-0 hidden xs:inline-flex">
                वॉर रूम
              </Badge>
            </div>
          </div>

          {/* Switch directly to another entity without leaving */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Select
              value={currentEntity.id}
              onValueChange={id => {
                setCurrentEntityId(id);
                setActiveWorkspaceId(id);
              }}
            >
              <SelectTrigger className="h-7 w-[150px] xs:w-[200px] sm:w-[240px] bg-slate-800 hover:bg-slate-700 border-slate-700 text-white text-xs font-semibold shadow-none truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-slate-800">
                {entities.map(ent => (
                  <SelectItem key={ent.id} value={ent.id} className="text-xs hover:bg-slate-800 cursor-pointer">
                    {ent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Complete Screen of Election Management */}
        <div className="flex-1">
          <VictoryApp />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FESTIVAL / BUSINESS WORKSPACE (Durga Puja, etc.)
  // -------------------------------------------------------------
  if (activeWorkspaceId && currentEntity.type !== 'election') {
    return (
      <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
        {/* Sleek Top Breadcrumb & Switcher Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveWorkspaceId(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shrink-0 h-8 px-2.5"
                title="मुख्य पोर्टल पर वापस जाएँ"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">मुख्य पोर्टल</span>
              </Button>

              <span className="text-slate-300 hidden sm:inline">|</span>

              {/* Entity Switcher dropdown */}
              <div className="flex items-center gap-1.5 flex-1 max-w-[260px] sm:max-w-[320px]">
                <Select
                  value={currentEntity.id}
                  onValueChange={id => {
                    setCurrentEntityId(id);
                    setActiveWorkspaceId(id);
                  }}
                >
                  <SelectTrigger className="h-8 w-full bg-slate-50 hover:bg-slate-100 border-slate-200 font-bold text-slate-900 text-xs shadow-none truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(ent => (
                      <SelectItem key={ent.id} value={ent.id} className="text-xs cursor-pointer font-medium">
                        {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold font-mono">
                  हाथ में शुद्ध शेष
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-700">
                  ₹{summary.netSurplus.toLocaleString('hi-IN')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Main Body */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* 4 Clean Minimalist KPI Cards - 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Total Pledged */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  स्वीकृत चंदा
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2 font-mono">
                ₹{summary.totalAccepted.toLocaleString('hi-IN')}
              </p>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                कुल दाता: {summary.totalDonors}
              </div>
            </div>

            {/* Total Collected */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider font-mono">
                  प्राप्त चंदा
                </span>
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1 sm:mt-2 font-mono">
                ₹{summary.totalReceived.toLocaleString('hi-IN')}
              </p>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex justify-between font-mono">
                <span>नकद: ₹{summary.cashReceived.toLocaleString('hi-IN')}</span>
                <span className="hidden xs:inline">UPI: ₹{summary.onlineReceived.toLocaleString('hi-IN')}</span>
              </div>
            </div>

            {/* Balance Dues */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-rose-600 uppercase tracking-wider font-mono">
                  शेष बकाया
                </span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-rose-600 mt-1 sm:mt-2 font-mono">
                ₹{summary.totalBalance.toLocaleString('hi-IN')}
              </p>
              <div className="text-[10px] sm:text-[11px] text-rose-500 mt-1 truncate">
                {summary.partialDonors + summary.pendingDonors} सहयोगकर्ताओं से वसूली शेष
              </div>
            </div>

            {/* Net Cash in Hand */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  हाथ में शुद्ध शेष
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2 font-mono">
                ₹{summary.netSurplus.toLocaleString('hi-IN')}
              </p>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                कुल खर्चा: ₹{summary.expensesPaid.toLocaleString('hi-IN')}
              </div>
            </div>
          </div>

          {/* Clean Segmented Workspace Tabs (Smooth Horizontal Swipe on Mobile) */}
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
            <div className="overflow-x-auto no-scrollbar pb-1">
              <TabsList className="bg-white border border-slate-200 shadow-xs p-1 rounded-xl flex items-center h-auto gap-1 w-max sm:w-auto">
                <TabsTrigger
                  value="chanda"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white font-semibold text-xs flex items-center gap-1.5 py-2 px-3 rounded-lg shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>चंदा रजिस्टर</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-800 data-[state=active]:bg-slate-800 data-[state=active]:text-white font-mono">
                    {summary.totalDonors}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="kharcha"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white font-semibold text-xs flex items-center gap-1.5 py-2 px-3 rounded-lg shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>खर्चा प्रबंधन</span>
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white font-semibold text-xs flex items-center gap-1.5 py-2 px-3 rounded-lg shrink-0"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>वित्तीय स्थिति</span>
                </TabsTrigger>

                <TabsTrigger
                  value="import_export"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white font-semibold text-xs flex items-center gap-1.5 py-2 px-3 rounded-lg shrink-0"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>एक्सेल इम्पोर्ट / एक्सपोर्ट</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Chanda Ledger */}
            <TabsContent value="chanda" className="m-0 focus-visible:outline-none">
              <ExcelDataGrid />
            </TabsContent>

            {/* TAB 2: Expense Manager */}
            <TabsContent value="kharcha" className="m-0 focus-visible:outline-none">
              <ExpenseManager />
            </TabsContent>

            {/* TAB 3: Financial Analytics */}
            <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
              <FinancialOverview />
            </TabsContent>

            {/* TAB 4: Import / Export */}
            <TabsContent value="import_export" className="m-0 focus-visible:outline-none">
              <ExcelImportExport />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: MODULAR EXECUTIVE GRID (MASTER PORTAL HOME)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20">
      {/* Sleek Top Master Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-12 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              M
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                Master OS • केंद्रीय प्रबंधन हब
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                समस्त व्यवसाय, चुनाव अभियान एवं उत्सव समितियाँ एक ही डैशबोर्ड से प्रबंधित
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToSampleData}
              className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50 hidden xs:inline-flex h-8 px-2.5"
            >
              रीसेट
            </Button>

            {/* Add Entity Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs h-8 px-2.5 sm:px-3">
                  <Plus className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">+ नया संगठन जोड़ें</span>
                  <span className="sm:hidden">+ जोड़ें</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[94vw]">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    नया संगठन, व्यवसाय या चुनाव जोड़ें
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreateEntity} className="space-y-3.5 mt-2 text-xs">
                  <div>
                    <Label className="text-xs font-medium">नाम *</Label>
                    <Input
                      placeholder="उदा० श्री छठ पूजा समिति / नारायणपुर टेक्सटाइल्स"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">प्रकार</Label>
                      <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                        <SelectTrigger className="mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="festival_samiti">उत्सव / पूजा समिति</SelectItem>
                          <SelectItem value="election">🗳️ चुनाव अभियान (Election)</SelectItem>
                          <SelectItem value="business">व्यापार / व्यवसाय</SelectItem>
                          <SelectItem value="rwa">सोसायटी / RWA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">स्थान</Label>
                      <Input
                        placeholder="उदा० मुख्य चौक"
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">सत्र / इवेंट शीर्षक *</Label>
                    <Input
                      placeholder="उदा० महोत्सव 2026 या वार्षिक ट्रेड शो"
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                      required
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">बजट लक्ष्य (₹)</Label>
                      <Input
                        type="number"
                        placeholder="300000"
                        value={newBudget}
                        onChange={e => setNewBudget(e.target.value)}
                        className="mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">UPI ID</Label>
                      <Input
                        placeholder="samiti@upi"
                        value={newUpi}
                        onChange={e => setNewUpi(e.target.value)}
                        className="mt-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                      रद्द करें
                    </Button>
                    <Button type="submit" size="sm" className="bg-slate-900 text-white">
                      सुरक्षित करें
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Portal Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Executive Summary Metrics Strip - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">कुल प्रबंधित संगठन</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {entities.length} इकाइयाँ
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">सक्रिय कार्यक्षेत्र सत्र</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 block font-mono">
              2026-27
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">संकलित चंदा निधि</span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1 block font-mono">
              ₹{summary.totalReceived.toLocaleString('hi-IN')}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block">शुद्ध परिचालन बचत</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 block font-mono">
              ₹{summary.netSurplus.toLocaleString('hi-IN')}
            </span>
          </div>
        </div>

        {/* Section Heading */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              समस्त कार्यक्षेत्र एवं इकाइयाँ (Select Workspace to Manage)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            किसी भी संगठन पर क्लिक करें — उसका संपूर्ण, व्यवस्थित एवं व्यवधान-मुक्त कार्यक्षेत्र (Distraction-Free Workspace) खुलेगा।
          </p>
        </div>

        {/* Modular Executive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {entities.map(ent => {
            const isElection = ent.type === 'election';
            const isDurga = ent.id === 'ent-durga-narayanpur';

            return (
              <div
                key={ent.id}
                onClick={() => openWorkspace(ent.id)}
                className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg group-hover:scale-105 transition-transform shrink-0">
                        {isElection ? '🗳️' : ent.type === 'festival_samiti' ? '🪔' : '🏢'}
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isElection
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isElection ? 'राजनीतिक वॉर रूम • लाइव' : ent.type === 'festival_samiti' ? 'उत्सव एवं चंदा समिति' : 'व्यापारिक इकाई'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-slate-950 transition-colors">
                      {ent.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {ent.tagline || ent.location || 'सक्रिय प्रबंधन कार्यक्षेत्र'}
                    </p>
                  </div>

                  {/* Highlights Pill Strip */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    {isElection ? (
                      <>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">मतदाता CRM</span>
                          <span className="font-bold text-slate-800 font-mono">45,000 मतदाता</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">बूथ एवं वॉर रूम</span>
                          <span className="font-bold text-slate-800 font-mono">42 बूथ एक्टिव</span>
                        </div>
                      </>
                    ) : isDurga ? (
                      <>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">प्राप्त चंदा</span>
                          <span className="font-bold text-emerald-700 font-mono">₹{summary.totalReceived.toLocaleString('hi-IN')}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">बकाया वसूली</span>
                          <span className="font-bold text-rose-600 font-mono">₹{summary.totalBalance.toLocaleString('hi-IN')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">सत्र</span>
                          <span className="font-bold text-slate-800 font-mono">2026-27</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-mono">प्रकार</span>
                          <span className="font-bold text-slate-800 font-mono">प्रबंधन कार्यक्षेत्र</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="pt-4 mt-2 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-slate-950">
                  <span>{isElection ? 'पूर्ण स्क्रीन वॉर रूम खोलें' : 'कार्यक्षेत्र खोलें'}</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Entity Card */}
          <div
            onClick={() => setIsCreateOpen(true)}
            className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-slate-100/50 transition-all min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">+ नया संगठन या व्यवसाय जोड़ें</p>
              <p className="text-xs text-slate-400 mt-1">नई पूजा समिति, सोसायटी RWA, या बिजनेस प्रोजेक्ट</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const MasterSamitiDashboard: React.FC = () => {
  return (
    <SamitiProvider>
      <MasterSamitiDashboardContent />
    </SamitiProvider>
  );
};

export default MasterSamitiDashboard;
