import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';

export const MasterOS: React.FC = () => {
  const navigate = useNavigate();
  const {
    entities,
    currentEntity,
    setCurrentEntityId,
    mainWorkspaceId,
  } = useSamiti();

  const { isCollector, assignedWorkspaceId } = useAuth();

  // null = Master Hub overview; string = active dedicated workspace view (for in-memory custom units)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Redirect assigned collectors directly to their dedicated unit portal
  useEffect(() => {
    if (isCollector || assignedWorkspaceId) {
      navigate('/durga-puja-unit', { replace: true });
    }
  }, [isCollector, assignedWorkspaceId, navigate]);


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
      // The election console was removed and will be rebuilt. Until then an
      // election workspace has nothing to open, so stay on Master OS.
      toast.info('चुनाव यूनिट अभी उपलब्ध नहीं है — यह दोबारा बनाई जा रही है।');
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
