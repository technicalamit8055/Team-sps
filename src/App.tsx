import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SamitiProvider } from "@/contexts/SamitiContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReloadPrompt } from "@/components/pwa/ReloadPrompt";

// Login stays eager: it is the PWA start_url and the redirect target for every
// unauthenticated visit, so splitting it would only add a round-trip.
import Login from "./pages/Login";

// Every other page is split out. A collector signing in no longer downloads
// the Master OS console, and a visitor on the landing page no longer downloads
// either console. <Suspense> below already provides the fallback.
const JantaPortal = lazy(() => import("./pages/JantaPortal"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MasterOS = lazy(() => import("./pages/MasterOS"));
const DurgaPujaUnitPage = lazy(() => import("./pages/DurgaPujaUnitPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component. Shared by <Suspense> and every route guard so a
// chunk load handing off to an auth check does not visibly swap one spinner
// for another in a different colour.
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);


// Protected route wrapper for Admin & Manager (Master OS)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
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
    return <Navigate to="/durga-puja-unit" replace />;
  }

  return <>{children}</>;
}

// Protected route for Samiti & Festival Units (accessible to Admin, Manager, and Collectors)
function SamitiRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
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
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Non-citizens go to their assigned unit, else Master OS.
  if (role && role !== 'citizen') {
    if (isCollector || assignedWorkspaceId) {
      return <Navigate to="/durga-puja-unit" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/master" replace />;
    }
    // Non-admin team members (workers) have no console of their own now that
    // the election unit is gone — send them to the chanda unit.
    return <Navigate to="/durga-puja-unit" replace />;
  }

  return <>{children}</>;
}

// Public route (redirects authenticated users)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isCollector, assignedWorkspaceId, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    // Redirect assigned collector workers straight to assigned unit
    if (isCollector || assignedWorkspaceId) {
      return <Navigate to="/durga-puja-unit" replace />;
    }
    // Redirect based on role
    if (role === 'citizen') {
      return <Navigate to="/janta" replace />;
    }
    // Admins redirect to Master OS
    if (role === 'admin') {
      return <Navigate to="/master" replace />;
    }
    // Workers land on the chanda unit.
    return <Navigate to="/durga-puja-unit" replace />;
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

      {/* The Election / Victory OS console has been removed — it will be
          rebuilt from scratch. Its old routes now point at Master OS so any
          bookmark or cached PWA link still lands somewhere valid. */}
      <Route path="/election" element={<Navigate to="/master" replace />} />
      <Route path="/dashboard" element={<Navigate to="/master" replace />} />
      <Route path="/victory" element={<Navigate to="/master" replace />} />
      <Route path="/victory-os" element={<Navigate to="/master" replace />} />

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

      {/* Dedicated Durga Puja Samiti Unit Route & Aliases */}
      <Route path="/durga-puja-unit" element={
        <SamitiRoute>
          <DurgaPujaUnitPage />
        </SamitiRoute>
      } />
      <Route path="/durga%20puja%20unit" element={<Navigate to="/durga-puja-unit" replace />} />
      <Route path="/durga puja unit" element={<Navigate to="/durga-puja-unit" replace />} />
      <Route path="/durga-puja" element={<Navigate to="/durga-puja-unit" replace />} />
      <Route path="/samiti" element={<Navigate to="/durga-puja-unit" replace />} />
      <Route path="/events" element={<Navigate to="/durga-puja-unit" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// react-query was mounted here but no component ever called useQuery, so the
// provider and the library it pulled in were pure bundle weight.
const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      {/* Only sonner is used for notifications; the shadcn toaster was mounted
          alongside it but nothing ever called its useToast(). */}
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
  </ErrorBoundary>
);

export default App;

