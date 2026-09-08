import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const JantaPortal = lazy(() => import("./pages/JantaPortal"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MasterSamitiDashboard = lazy(() => import("./pages/MasterSamitiDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

// Protected route wrapper for team (admin, manager, worker)
function TeamRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();

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

  return <>{children}</>;
}

// Protected route for citizens only
function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();

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

  // Non-citizens go to main dashboard
  if (role && role !== 'citizen') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Public route (redirects authenticated users)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-victory-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (role === 'citizen') {
      return <Navigate to="/janta" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public landing page - no auth required */}
      <Route path="/" element={<LandingPage />} />

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
      <Route path="/dashboard" element={
        <TeamRoute>
          <Index />
        </TeamRoute>
      } />
      {/* Master Event & Samiti Dashboard */}
      <Route path="/samiti" element={<MasterSamitiDashboard />} />
      <Route path="/master" element={<MasterSamitiDashboard />} />
      <Route path="/events" element={<MasterSamitiDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
