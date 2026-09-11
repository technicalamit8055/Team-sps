import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SamitiProvider } from "@/contexts/SamitiContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReloadPrompt } from "@/components/pwa/ReloadPrompt";

// Static page imports for rock-solid reliability across HMR, dev servers, and PWA
import Index from "./pages/Index";
import Login from "./pages/Login";
import JantaPortal from "./pages/JantaPortal";
import LandingPage from "./pages/LandingPage";
import MasterOS from "./pages/MasterOS";
import NotFound from "./pages/NotFound";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

// Protected route wrapper for team (admin, manager, worker)
function TeamRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-victory-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Citizens go to Janta Portal
  if (role === 'citizen') {
    return <Navigate to="/janta" replace />;
  }

  // Assigned collector workers can only access their assigned unit
  if (isCollector || assignedWorkspaceId) {
    return <Navigate to="/samiti" replace />;
  }

  return <>{children}</>;
}

// Protected route wrapper for Admin & Manager (Master OS)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Citizens go to Janta Portal
  if (role === 'citizen') {
    return <Navigate to="/janta" replace />;
  }

  // Collectors are restricted from Master OS central command and redirected to their unit
  if (isCollector || assignedWorkspaceId) {
    return <Navigate to="/samiti" replace />;
  }

  return <>{children}</>;
}

// Protected route for Samiti & Festival Units (accessible to Admin, Manager, and Collectors)
function SamitiRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'citizen') {
    return <Navigate to="/janta" replace />;
  }

  return <>{children}</>;
}

// Protected route for citizens only
function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-victory-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Non-citizens go to assigned unit or election workspace or master
  if (role && role !== 'citizen') {
    if (isCollector || assignedWorkspaceId) {
      return <Navigate to="/samiti" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/master" replace />;
    }
    return <Navigate to="/election" replace />;
  }

  return <>{children}</>;
}

// Public route (redirects authenticated users)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-victory-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    // Redirect assigned collector workers straight to assigned unit
    if (isCollector || assignedWorkspaceId) {
      return <Navigate to="/samiti" replace />;
    }
    // Redirect based on role
    if (role === 'citizen') {
      return <Navigate to="/janta" replace />;
    }
    // Admins redirect to Master OS
    if (role === 'admin') {
      return <Navigate to="/master" replace />;
    }
    return <Navigate to="/election" replace />;
  }

  return <>{children}</>;
}

// Root route handler: Redirects directly to /login when opened in PWA mode
function RootRoute() {
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('source=pwa')
  );

  if (isStandalone) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public landing page in browser; directly redirects to /login in PWA */}
      <Route path="/" element={<RootRoute />} />

      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/janta" element={
        <CitizenRoute>
          <JantaPortal />
        </CitizenRoute>
      } />

      {/* Primary Election Command / Victory OS Console */}
      <Route path="/election" element={
        <TeamRoute>
          <Index />
        </TeamRoute>
      } />

      {/* Legacy and convenience route redirects */}
      <Route path="/dashboard" element={<Navigate to="/election" replace />} />
      <Route path="/victory" element={<Navigate to="/election" replace />} />
      <Route path="/victory-os" element={<Navigate to="/election" replace />} />

      {/* Master OS Hub & Workspace Control Plane */}
      <Route path="/master" element={
        <AdminRoute>
          <MasterOS />
        </AdminRoute>
      } />
      <Route path="/master-os" element={
        <AdminRoute>
          <MasterOS />
        </AdminRoute>
      } />
      <Route path="/samiti" element={
        <SamitiRoute>
          <MasterOS />
        </SamitiRoute>
      } />
      <Route path="/events" element={
        <SamitiRoute>
          <MasterOS />
        </SamitiRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <SamitiProvider>
              <AppRoutes />
            </SamitiProvider>
          </AuthProvider>
        </BrowserRouter>
        <ReloadPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

