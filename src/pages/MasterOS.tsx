import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSamiti } from '@/contexts/SamitiContext';
import { useAuth } from '@/hooks/useAuth';
import { MasterNavSection } from '@/types/master';
import { MasterSidebar } from '@/components/master/MasterSidebar';
import { MasterHeader } from '@/components/master/MasterHeader';
import { WorkspaceManagerView } from '@/components/master/WorkspaceManagerView';
import { StaffKaryakartaView } from '@/components/master/StaffKaryakartaView';
import { AccessControlMatrixView } from '@/components/master/AccessControlMatrixView';
import { MasterAnalyticsView } from '@/components/master/MasterAnalyticsView';
import { IntegrationsView } from '@/components/master/IntegrationsView';
import { DurgaPujaUnitView } from '@/components/samiti/DurgaPujaUnitView';
import VictoryApp from '@/pages/Index';
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
  Vote,
  Radio,
} from 'lucide-react';

export const MasterOS: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    entities,
    currentEntity,
    setCurrentEntityId,
    summary,
    mainWorkspaceId,
    setMainWorkspaceId,
    isMainWorkspace,
    mainWorkspace,
  } = useSamiti();

  const { profile, role, isCollector, assignedWorkspaceId, signOut } = useAuth();

  // null = Master Hub overview; string = active dedicated workspace view (for in-memory custom units)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Redirect assigned collectors directly to their dedicated unit portal
  useEffect(() => {
    if (isCollector || assignedWorkspaceId) {
      navigate('/durga-puja-unit', { replace: true });
    }
  }, [isCollector, assignedWorkspaceId, navigate]);

  const [activeTab, setActiveTab] = useState<'chanda' | 'kharcha' | 'analytics' | 'import_export'>('chanda');

  // Master OS Navigation & Modal States
  const [activeSection, setActiveSection] = useState<MasterNavSection>('workspaces');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const openWorkspace = (entityId: string) => {
    setCurrentEntityId(entityId);
    const target = entities.find(e => e.id === entityId);
    if (target?.type === 'election' || entityId === 'ent-election-2026') {
      navigate('/election');
    } else if (entityId === 'ent-durga-narayanpur' || target?.type === 'festival_samiti') {
      navigate('/durga-puja-unit');
    } else {
      setActiveWorkspaceId(entityId);
    }
  };

  const launchMainWorkspace = () => {
    openWorkspace(mainWorkspaceId);
  };

  // -------------------------------------------------------------
  // VIEW 1: DEDICATED FULL-SCREEN ELECTION MANAGEMENT WORKSPACE
  // -------------------------------------------------------------
  if (activeWorkspaceId && currentEntity.type === 'election') {
    const isMain = isMainWorkspace(currentEntity.id);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sleek Victory OS Command Top Bar */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-[hsl(var(--navy))] via-[hsl(var(--navy-dark))] to-[#050B14] text-white px-3 sm:px-6 lg:px-8 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 sm:gap-3 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setActiveWorkspaceId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all border border-white/15 shrink-0 shadow-sm"
              title="Return to Master OS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Master OS</span>
            </button>
            <span className="text-white/20 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 truncate">
              <div className="flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-saffron shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {currentEntity.name}
                </span>
              </div>

              {isMain ? (
                <Badge className="bg-saffron text-white text-[10px] font-bold shrink-0 inline-flex items-center gap-1 py-0 px-2 rounded-full border-none shadow-xs">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Main Unit
                </Badge>
              ) : (
                <button
                  onClick={() => setMainWorkspaceId(currentEntity.id)}
                  className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white/80 px-2 py-0.5 rounded-lg border border-white/15 hidden sm:inline-flex items-center gap-1 transition-colors"
                  title="Set as Main War Room"
                >
                  <Star className="w-2.5 h-2.5" />
                  Set Main
                </button>
              )}
            </div>
          </div>

          {/* Quick Workspace Switcher Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mr-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              War Room Active
            </div>

            <span className="text-[11px] text-white/60 hidden md:inline">Switch:</span>
            <Select
              value={currentEntity.id}
              onValueChange={id => {
                setCurrentEntityId(id);
                setActiveWorkspaceId(id);
              }}
            >
              <SelectTrigger className="h-8 w-[160px] xs:w-[200px] sm:w-[230px] bg-white/10 hover:bg-white/15 border-white/15 text-white text-xs font-semibold rounded-xl shadow-none truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gradient-to-b from-[hsl(var(--navy))] to-[hsl(var(--navy-dark))] text-white border-white/10">
                {entities.map(ent => (
                  <SelectItem key={ent.id} value={ent.id} className="text-xs hover:bg-white/10 cursor-pointer">
                    {ent.id === mainWorkspaceId ? '⭐ ' : ''}{ent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Election Management Console */}
        <div className="flex-1">
          <VictoryApp />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FESTIVAL / BUSINESS / SAMITI WORKSPACE
  // -------------------------------------------------------------
  if (isCollector || assignedWorkspaceId) {
    return <DurgaPujaUnitView isCollectorMode={true} />;
  }

  if (activeWorkspaceId && currentEntity.type !== 'election') {
    return <DurgaPujaUnitView onBackToMaster={() => setActiveWorkspaceId(null)} />;
  }

  // -------------------------------------------------------------
  // VIEW 3: MASTER OS EXECUTIVE CONTROL PLANE & WORKSPACE HUB
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron/5 via-background to-navy/5 text-foreground selection:bg-saffron selection:text-white flex flex-col lg:flex-row">
      {/* Executive Sidebar */}
      <MasterSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenWorkspace={openWorkspace}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateWorkspaceModal={() => setIsCreateWorkspaceModalOpen(true)}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <MasterHeader
          activeSection={activeSection}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateWorkspaceModal={() => setIsCreateWorkspaceModalOpen(true)}
          onOpenCreateStaffModal={() => setIsCreateStaffModalOpen(true)}
          onLaunchMainWorkspace={launchMainWorkspace}
          searchQuery={globalSearchQuery}
          setSearchQuery={setGlobalSearchQuery}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {activeSection === 'workspaces' && (
            <WorkspaceManagerView
              onOpenWorkspace={openWorkspace}
              searchQuery={globalSearchQuery}
              isCreateModalOpen={isCreateWorkspaceModalOpen}
              setIsCreateModalOpen={setIsCreateWorkspaceModalOpen}
            />
          )}

          {activeSection === 'manage-workspaces' && (
            <WorkspaceManagerView
              onOpenWorkspace={openWorkspace}
              searchQuery={globalSearchQuery}
              isCreateModalOpen={isCreateWorkspaceModalOpen}
              setIsCreateModalOpen={setIsCreateWorkspaceModalOpen}
            />
          )}

          {activeSection === 'staff-team' && (
            <StaffKaryakartaView
              onNavigateToPermissions={() => {
                setActiveSection('access-control');
              }}
              isCreateModalOpen={isCreateStaffModalOpen}
              setIsCreateModalOpen={setIsCreateStaffModalOpen}
              searchQuery={globalSearchQuery}
            />
          )}

          {activeSection === 'access-control' && (
            <AccessControlMatrixView searchQuery={globalSearchQuery} />
          )}

          {activeSection === 'master-analytics' && (
            <MasterAnalyticsView onOpenWorkspace={openWorkspace} />
          )}

          {activeSection === 'integrations' && <IntegrationsView />}
        </main>
      </div>
    </div>
  );
};

export default MasterOS;
