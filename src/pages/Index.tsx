import React, { Suspense, lazy } from 'react';
import { VictoryProvider, useVictory } from '@/contexts/VictoryContext';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { FAB } from '@/components/FAB';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Layers } from 'lucide-react';

// Lazy load dashboard pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CRM = lazy(() => import('@/pages/CRM').then(m => ({ default: m.CRM })));
const VoterCRMPage = lazy(() => import('@/components/VoterCRM').then(m => ({ default: m.VoterCRM })));
const Operations = lazy(() => import('@/pages/Operations').then(m => ({ default: m.Operations })));
const Strategy = lazy(() => import('@/pages/Strategy').then(m => ({ default: m.Strategy })));
const GroundZero = lazy(() => import('@/pages/GroundZero').then(m => ({ default: m.GroundZero })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useVictory();
  const { profile, role, signOut } = useAuth();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'crm':
        return <CRM />;
      case 'ops':
        return <Operations />;
      case 'strategy':
        return <Strategy />;
      case 'ground':
        return <GroundZero />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getRoleBadgeStyle = () => {
    const styles: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 border-red-500/30',
      manager: 'bg-victory-saffron/10 text-victory-saffron border-victory-saffron/30',
      worker: 'bg-victory-navy/10 text-victory-navy border-victory-navy/30',
    };
    return styles[role || ''] || 'bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      {/* Main Content */}
      <main className="page-container">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-dark flex items-center justify-center">
                <span className="text-lg font-bold text-white">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Victory OS</h1>
                <p className="text-xs text-muted-foreground">v26</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('settings')}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        {/* Desktop User Header */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-victory-navy/10 flex items-center justify-center">
              <User className="w-5 h-5 text-victory-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{profile?.full_name || profile?.username}</span>
                <Badge variant="outline" className={getRoleBadgeStyle()}>
                  {role?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(role === 'admin' || role === 'manager') && (
              <Link to="/master">
                <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5 h-8">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Master OS हब</span>
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </div>
      </main>

      {/* FAB for quick actions */}
      <FAB />
    </div>
  );
};

const VictoryApp: React.FC = () => {
  return (
    <VictoryProvider>
      <MainContent />
    </VictoryProvider>
  );
};

export default VictoryApp;
