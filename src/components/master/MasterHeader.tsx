import React from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { MasterNavSection } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Menu,
  Search,
  Plus,
  UserPlus,
  Star,
  ExternalLink,
  Vote,
  FolderKanban,
  Users2,
  ShieldCheck,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

interface MasterHeaderProps {
  activeSection: MasterNavSection;
  onOpenMobileMenu: () => void;
  onOpenCreateWorkspaceModal: () => void;
  onOpenCreateStaffModal: () => void;
  onLaunchMainWorkspace: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SECTION_TITLES: Record<
  MasterNavSection,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  workspaces: {
    title: 'Workspaces Hub',
    subtitle: 'Overview of all active war rooms and campaign units',
    icon: <Vote className="w-4 h-4 text-saffron" />,
  },
  'manage-workspaces': {
    title: 'Manage Workspaces',
    subtitle: 'Create, edit, or configure campaign units',
    icon: <FolderKanban className="w-4 h-4 text-sky-500" />,
  },
  'staff-team': {
    title: 'Team & Cadre',
    subtitle: 'Directory of incharges, coordinators, and field workers',
    icon: <Users2 className="w-4 h-4 text-emerald-600" />,
  },
  'access-control': {
    title: 'Access Matrix',
    subtitle: 'Control data access and module permissions',
    icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
  },
  'master-analytics': {
    title: 'Analytics & Intel',
    subtitle: 'Consolidated financial, budget, and ground metrics',
    icon: <BarChart3 className="w-4 h-4 text-saffron" />,
  },
};

export const MasterHeader: React.FC<MasterHeaderProps> = ({
  activeSection,
  onOpenMobileMenu,
  onOpenCreateWorkspaceModal,
  onOpenCreateStaffModal,
  onLaunchMainWorkspace,
  searchQuery,
  setSearchQuery,
}) => {
  const { mainWorkspace, isCloudConnected, isSyncing, syncWithCloud } = useSamiti();
  const currentInfo = SECTION_TITLES[activeSection] || SECTION_TITLES.workspaces;

  return (
    <header className="sticky top-0 z-20 glass-panel rounded-none border-x-0 border-t-0 border-b border-border/50 px-3 sm:px-6 lg:px-8 py-3 transition-all backdrop-blur-xl bg-white/85 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Hamburger & Breadcrumb Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron hidden sm:inline-flex items-center gap-1">
                Victory OS
                <span className="text-slate-400 font-normal">/</span>
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <div className="p-1 rounded-lg bg-slate-100 shrink-0">
                  {currentInfo.icon}
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                  {currentInfo.title}
                </h1>
                <button
                  type="button"
                  onClick={() => syncWithCloud()}
                  disabled={isSyncing || !isCloudConnected}
                  className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isSyncing
                      ? 'bg-amber-100 text-amber-800 border-amber-300 cursor-wait'
                      : isCloudConnected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 cursor-not-allowed'
                  }`}
                  title={
                    isSyncing
                      ? 'Syncing with cloud...'
                      : isCloudConnected
                      ? 'Online - Click to sync with Cloud'
                      : 'Offline - Network disconnected'
                  }
                >
                  {isSyncing ? (
                    <RefreshCw className="w-2.5 h-2.5 text-amber-700 animate-spin" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCloudConnected ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  )}
                  {isSyncing ? 'SYNCING...' : isCloudConnected ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block mt-0.5">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Search + Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-between md:justify-end">
          {/* Quick Search */}
          <div className="relative w-full max-w-[170px] sm:max-w-[210px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2.5 text-xs bg-slate-50/80 border-slate-200 focus:bg-white rounded-xl shadow-none transition-all"
            />
          </div>

          {/* Launch Main Workspace Button */}
          {mainWorkspace && (
            <Button
              size="sm"
              onClick={onLaunchMainWorkspace}
              className="bg-navy hover:bg-navy-dark text-white font-bold text-xs h-8 px-2.5 sm:px-3 rounded-xl shadow-xs hidden xl:inline-flex items-center gap-1.5 border border-white/10"
              title={`Open '${mainWorkspace.name}'`}
            >
              <Star className="w-3.5 h-3.5 fill-saffron text-saffron" />
              <span>Main War Room</span>
              <ExternalLink className="w-3 h-3 text-white/70" />
            </Button>
          )}

          {/* PWA Install Action */}
          <PWAInstallButton variant="master" />

          {/* Add Staff Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCreateStaffModal}
            className="text-xs font-semibold h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-navy hidden sm:inline-flex items-center gap-1 shadow-none"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Member</span>
          </Button>

          {/* Add Workspace Button */}
          <Button
            size="sm"
            onClick={onOpenCreateWorkspaceModal}
            className="btn-saffron text-xs h-8 px-2.5 sm:px-3 rounded-xl shadow-sm flex items-center gap-1 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Unit</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
