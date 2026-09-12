import React from 'react';
import { useVictory } from '@/contexts/VictoryContext';
import { useAuth } from '@/hooks/useAuth';
import { TabType } from '@/types/victory';
import { Home, Users, Briefcase, Brain } from 'lucide-react';

const navItems: { id: TabType; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'crm', label: 'CRM', icon: <Users className="w-5 h-5" /> },
  { id: 'ops', label: 'Ops', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'strategy', label: 'AI', icon: <Brain className="w-5 h-5" /> },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useVictory();
  const { role } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role || '');
  });

  return (
    <div className="bottom-nav">
      <div className="flex justify-around items-center">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-item flex-1 ${activeTab === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
