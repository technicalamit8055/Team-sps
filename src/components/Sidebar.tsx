import React from 'react';
import { Link } from 'react-router-dom';
import { useVictory } from '@/contexts/VictoryContext';
import { useAuth } from '@/hooks/useAuth';
import { TabType } from '@/types/victory';
import { Home, Users, Briefcase, Brain, MapPin, Settings, Layers } from 'lucide-react';

const navItems: { id: TabType; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'crm', label: 'CRM', icon: <Users className="w-5 h-5" /> },
  { id: 'ops', label: 'Ops', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'strategy', label: 'AI', icon: <Brain className="w-5 h-5" /> },
  { id: 'ground', label: 'Ground', icon: <MapPin className="w-5 h-5" /> },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, data } = useVictory();
  const { role, profile } = useAuth();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role || '');
  });

  return (
    <div className="sidebar">
      {/* Logo & Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron to-saffron-dark flex items-center justify-center">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Victory OS</h1>
            <p className="text-xs text-white/60">v26 • Election Command</p>
          </div>
        </div>
      </div>

      {/* Candidate Info */}
      <div className="p-4 mx-4 mt-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-wider">Candidate</p>
        <p className="text-white font-semibold truncate">{data.settings.candidateName}</p>
        <p className="text-sm text-white/70">{data.settings.constituency}</p>
      </div>

      {/* User Info */}
      {profile && (
        <div className="p-3 mx-4 mt-2 rounded-lg bg-saffron/10 border border-saffron/20">
          <p className="text-xs text-saffron/70">Logged in as</p>
          <p className="text-white text-sm font-medium truncate">{profile.full_name || profile.username}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-saffron/20 text-saffron uppercase">
            {role}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {/* Master OS Central Command */}
        {(role === 'admin' || role === 'manager') && (
          <Link
            to="/master"
            className="sidebar-item w-full text-amber-300 hover:text-amber-200 hover:bg-white/10 mt-2 border border-amber-400/40 bg-amber-500/10 rounded-xl"
          >
            <Layers className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex flex-col text-left truncate">
              <span className="font-bold text-xs">Master OS</span>
              <span className="text-[10px] text-amber-300/80 truncate">कार्यक्षेत्र हब</span>
            </div>
          </Link>
        )}
      </nav>

      {/* Settings at bottom */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={() => setActiveTab('settings')}
          className={`sidebar-item w-full ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>

      {/* Tricolor bar */}
      <div className="tricolor-bar" />
    </div>
  );
};
