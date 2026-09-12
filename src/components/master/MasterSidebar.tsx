import React from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { useAuth } from '@/hooks/useAuth';
import { MasterNavSection } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Layers,
  FolderKanban,
  Users2,
  ShieldCheck,
  BarChart3,
  Star,
  ExternalLink,
  LogOut,
  X,
  PlusCircle,
  Globe,
  ChevronRight,
  Vote,
  Flame,
  Building2,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MasterSidebarProps {
  activeSection: MasterNavSection;
  setActiveSection: (section: MasterNavSection) => void;
  onOpenWorkspace: (workspaceId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCreateWorkspaceModal?: () => void;
}

export const MasterSidebar: React.FC<MasterSidebarProps> = ({
  activeSection,
  setActiveSection,
  onOpenWorkspace,
  isOpenMobile,
  onCloseMobile,
  onOpenCreateWorkspaceModal,
}) => {
  const { entities, mainWorkspace, mainWorkspaceId, staffList } = useSamiti();
  const { profile, role, signOut } = useAuth();

  const navGroups = [
    {
      title: 'Workspaces',
      items: [
        {
          id: 'workspaces' as MasterNavSection,
          label: 'Overview',
          subtitle: 'Active units & war rooms',
          icon: <Vote className="w-4 h-4 text-saffron" />,
          badge: `${entities.length}`,
        },
        {
          id: 'manage-workspaces' as MasterNavSection,
          label: 'Manage Units',
          subtitle: 'Create and configure',
          icon: <FolderKanban className="w-4 h-4 text-sky-400" />,
        },
      ],
    },
    {
      title: 'Team & Access',
      items: [
        {
          id: 'staff-team' as MasterNavSection,
          label: 'Team & Cadre',
          subtitle: 'Staff & field workers',
          icon: <Users2 className="w-4 h-4 text-emerald-400" />,
          badge: `${staffList.length}`,
        },
        {
          id: 'access-control' as MasterNavSection,
          label: 'Access Matrix',
          subtitle: 'Roles & permissions',
          icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        {
          id: 'master-analytics' as MasterNavSection,
          label: 'Analytics',
          subtitle: 'Consolidated stats',
          icon: <BarChart3 className="w-4 h-4 text-saffron-light" />,
        },
        {
          id: 'integrations' as MasterNavSection,
          label: 'Integrations',
          subtitle: 'WhatsApp & messaging',
          icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
        },
      ],
    },
  ];

  const handleNavClick = (section: MasterNavSection) => {
    setActiveSection(section);
    onCloseMobile();
  };

  const handleWorkspaceQuickClick = (id: string) => {
    onOpenWorkspace(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[hsl(var(--navy))] via-[hsl(var(--navy-dark))] to-[#050B14] text-white border-r border-white/10 selection:bg-saffron selection:text-white">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron via-saffron-light to-orange-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/30 shrink-0 ring-2 ring-saffron/40">
            V
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Victory OS
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-saffron/20 text-saffron border border-saffron/30 uppercase">
                Master
              </span>
            </div>
            <p className="text-[11px] text-white/60 truncate flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              Central Command
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Main Workspace Highlight Box */}
      <div className="p-3 mx-3 mt-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-saffron font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-saffron text-saffron" />
            Main War Room
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <p className="text-sm font-bold text-white mt-1 truncate">
          {mainWorkspace?.name || 'Election Campaign 2026'}
        </p>
        <p className="text-[10px] text-white/60 truncate">
          {mainWorkspace?.location || 'Central Constituency'}
        </p>
        <button
          onClick={() => handleWorkspaceQuickClick(mainWorkspaceId)}
          className="mt-2.5 w-full py-1.5 px-3 rounded-lg btn-saffron text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <span>Launch War Room</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map(group => (
          <div key={group.title} className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2.5 py-1">
              {group.title}
            </h3>
            {group.items.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-r from-saffron to-saffron-light text-white font-semibold shadow-md shadow-orange-500/25 ring-1 ring-white/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-black/20 text-white'
                          : 'bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {item.label}
                      </p>
                      <p
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-white/90' : 'text-white/50 group-hover:text-white/70'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {item.badge && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold shrink-0 ml-1.5 ${
                        isActive
                          ? 'border-white/30 text-white bg-black/20'
                          : 'border-white/10 text-white/70 bg-white/5'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Quick Launch Workspaces List */}
        <div className="space-y-1 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between px-2.5 py-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Units
            </h3>
            {onOpenCreateWorkspaceModal && (
              <button
                onClick={onOpenCreateWorkspaceModal}
                className="text-[10px] text-saffron hover:text-saffron-light font-bold flex items-center gap-0.5 transition-colors"
                title="Create Workspace"
              >
                <PlusCircle className="w-3 h-3" />
                <span>New</span>
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {entities.map(ent => {
              const isMain = ent.id === mainWorkspaceId;
              const isElection = ent.type === 'election';
              return (
                <button
                  key={ent.id}
                  onClick={() => handleWorkspaceQuickClick(ent.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="shrink-0">
                      {isElection ? (
                        <Vote className="w-3.5 h-3.5 text-saffron" />
                      ) : ent.type === 'festival_samiti' ? (
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </span>
                    <span className="truncate text-[11px] group-hover:text-white font-medium">
                      {ent.name}
                    </span>
                  </div>
                  {isMain && (
                    <Star className="w-3 h-3 fill-saffron text-saffron shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Profile & Exit */}
      <div className="p-3 border-t border-white/10 space-y-2 bg-black/20">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron to-saffron-dark text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'V'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {profile?.full_name || profile?.username || 'Command Admin'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-saffron/20 text-saffron font-bold uppercase tracking-wider">
                  {role || 'ADMIN'}
                </span>
                <span className="text-[9px] text-white/50">• War Room</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-white/60 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 p-0 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Link
          to="/"
          className="text-[11px] text-white/60 hover:text-white px-2 py-1 flex items-center justify-between rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-white/50" />
            Public View
          </span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Indian Tricolor Bar Accent */}
      <div className="tricolor-bar" />
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
