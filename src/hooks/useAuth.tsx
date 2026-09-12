import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'manager' | 'worker' | 'citizen';

export interface AuthUserProfile {
  username: string;
  full_name: string;
  ward_number: number | null;
  phone: string | null;
  assigned_workspace_id?: string | null;
  is_collector?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: AuthUserProfile | null;
  assignedWorkspaceId: string | null;
  isCollector: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{
    error: string | null;
    role?: AppRole | null;
    assignedWorkspaceId?: string | null;
    isCollector?: boolean;
  }>;
  signOut: () => Promise<void>;
}

// Derives the collector assignment for a staff member from their workspace
// permission map. Shared by both the cached (localStorage) and the
// authoritative (Supabase) lookups below so the two can never disagree.
const deriveCollectorInfo = (
  staff: {
    name?: string;
    username?: string;
    primaryRole?: string;
    workspacePermissions?: Record<string, { accessLevel?: string }>;
  } | null | undefined
): { assignedWorkspaceId: string | null; isCollector: boolean; staffName?: string } => {
  if (!staff) return { assignedWorkspaceId: null, isCollector: false };

  const perms = staff.workspacePermissions || {};

  // An explicit 'collector' access level on any workspace is the strongest signal.
  const collectorWs = Object.entries(perms).find(([, p]) => p?.accessLevel === 'collector');
  if (collectorWs) {
    return { assignedWorkspaceId: collectorWs[0], isCollector: true, staffName: staff.name };
  }

  const wsIds = Object.keys(perms);

  if (staff.primaryRole === 'collector') {
    return {
      assignedWorkspaceId: wsIds[0] || 'ent-durga-narayanpur',
      isCollector: true,
      staffName: staff.name,
    };
  }

  // A member assigned to exactly one non-election workspace is scoped to that
  // unit, regardless of the access level they hold inside it.
  if (wsIds.length === 1 && wsIds[0] !== 'ent-election-2026') {
    return { assignedWorkspaceId: wsIds[0], isCollector: true, staffName: staff.name };
  }

  return { assignedWorkspaceId: null, isCollector: false };
};

// Reads the locally-cached staff roster. Used only as an offline fallback and
// as an instant hint before the authoritative Supabase lookup resolves — it is
// never used to authenticate a login. Real authentication always goes through
// Supabase Auth.
export const getStaffCollectorInfo = (
  username: string
): { assignedWorkspaceId: string | null; isCollector: boolean; staffName?: string } => {
  const cleanUser = (username || '').toLowerCase().trim();
  if (!cleanUser) return { assignedWorkspaceId: null, isCollector: false };

  try {
    const rawStaff = localStorage.getItem('victory_master_staff_v1');
    if (rawStaff) {
      const staffList = JSON.parse(rawStaff);
      if (Array.isArray(staffList)) {
        const staff = staffList.find(s => s?.username?.toLowerCase() === cleanUser);
        if (staff) return deriveCollectorInfo(staff);
      }
    }
  } catch (e) {
    console.warn('Error reading staff for collector info:', e);
  }

  return { assignedWorkspaceId: null, isCollector: false };
};

// Authoritative collector lookup: reads the staff roster straight from
// Supabase, so a member logging in on a device that has never cached the
// roster still lands on the correct unit on the very first navigation.
// Falls back to the local cache when the network/table is unavailable.
export const fetchStaffCollectorInfo = async (
  username: string,
  userId?: string
): Promise<{ assignedWorkspaceId: string | null; isCollector: boolean; staffName?: string }> => {
  const cleanUser = (username || '').toLowerCase().trim();

  type StaffRow = {
    name?: string;
    username?: string;
    primary_role?: string;
    workspace_permissions?: unknown;
  };

  try {
    let staffRow: StaffRow | null = null;

    // The generated Supabase types make this chained builder blow past the TS
    // instantiation-depth limit, so the builder is narrowed to a plain shape.
    const staffTable = () =>
      (supabase.from('master_staff') as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: StaffRow | null }> };
          ilike: (col: string, val: string) => { maybeSingle: () => Promise<{ data: StaffRow | null }> };
        };
      }).select('name, username, primary_role, workspace_permissions');

    // Prefer the auth user id — it stays stable even if the username is edited.
    if (userId) {
      const { data } = await staffTable().eq('user_id', userId).maybeSingle();
      staffRow = data ?? null;
    }

    if (!staffRow && cleanUser) {
      const { data } = await staffTable().ilike('username', cleanUser).maybeSingle();
      staffRow = data ?? null;
    }

    if (staffRow) {
      return deriveCollectorInfo({
        name: staffRow.name,
        username: staffRow.username,
        primaryRole: staffRow.primary_role,
        workspacePermissions:
          (staffRow.workspace_permissions as Record<string, { accessLevel?: string }>) || {},
      });
    }
  } catch (e) {
    console.warn('Could not resolve collector info from Supabase, using local cache:', e);
  }

  return getStaffCollectorInfo(cleanUser);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [assignedWorkspaceId, setAssignedWorkspaceId] = useState<string | null>(null);
  const [isCollector, setIsCollector] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resolves role, profile and collector assignment for a signed-in user.
  // Returns both the role and the resolved collector info so callers (signIn)
  // can route immediately without waiting for a second state round-trip.
  const fetchUserData = async (
    userId: string,
    overrideUsername?: string
  ): Promise<{ role: AppRole | null; assignedWorkspaceId: string | null; isCollector: boolean }> => {
    try {
      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const fetchedRole = (roleData?.role as AppRole) ?? null;
      if (fetchedRole) {
        setRole(fetchedRole);
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name, ward_number, phone')
        .eq('id', userId)
        .single();

      const username = profileData?.username || overrideUsername || '';
      // Authoritative lookup against Supabase so a member signing in on a fresh
      // device (empty localStorage roster) is still recognised as scoped to
      // their assigned unit on the very first render.
      const collectorInfo = await fetchStaffCollectorInfo(username, userId);

      if (profileData) {
        setProfile({
          ...profileData,
          assigned_workspace_id: collectorInfo.assignedWorkspaceId,
          is_collector: collectorInfo.isCollector,
        });
      }

      if (collectorInfo.isCollector) {
        setIsCollector(true);
        setAssignedWorkspaceId(collectorInfo.assignedWorkspaceId);
      } else {
        setIsCollector(false);
        setAssignedWorkspaceId(null);
      }

      return {
        role: fetchedRole,
        assignedWorkspaceId: collectorInfo.assignedWorkspaceId,
        isCollector: collectorInfo.isCollector,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { role: null, assignedWorkspaceId: null, isCollector: false };
    }
  };

  useEffect(() => {
    // Set up Supabase auth listener — the only source of truth for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Sign-ins are handled end-to-end by signIn() itself (it awaits
        // fetchUserData before returning), so skip this event here to avoid
        // a second, racing fetch that can overwrite state mid-navigation.
        if (event === 'SIGNED_IN') {
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          // Stay in the loading state until role + unit assignment are known,
          // so route guards never evaluate against a half-populated session
          // and briefly render the wrong dashboard.
          await fetchUserData(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          setAssignedWorkspaceId(null);
          setIsCollector(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        // Await before clearing isLoading — otherwise a refresh renders the
        // election dashboard for a moment before the unit assignment arrives.
        await fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (
    username: string,
    password: string
  ): Promise<{ error: string | null; role?: AppRole | null; assignedWorkspaceId?: string | null; isCollector?: boolean }> => {
    const cleanUser = username.trim().toLowerCase();

    try {
      // Convert username to proxy email for Supabase Auth
      const proxyEmail = `${cleanUser.replace(/[^a-z0-9]/g, '')}@victory.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: proxyEmail,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'गलत Username या Password। कृपया पुनः प्रयास करें।' };
        }
        return { error: error.message };
      }

      let userRole: AppRole | null = null;
      let resolvedWorkspaceId: string | null = null;
      let resolvedIsCollector = false;

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);

        // Resolve role + unit assignment from Supabase before returning, so the
        // caller navigates straight to the correct destination and never shows
        // the election dashboard first.
        const userData = await fetchUserData(data.user.id, cleanUser);
        userRole = userData.role;
        resolvedWorkspaceId = userData.assignedWorkspaceId;
        resolvedIsCollector = userData.isCollector;
      }

      return {
        error: null,
        role: userRole,
        assignedWorkspaceId: resolvedWorkspaceId,
        isCollector: resolvedIsCollector,
      };
    } catch (err) {
      return { error: 'Login failed. Please try again.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAssignedWorkspaceId(null);
    setIsCollector(false);
    toast.success('सफलतापूर्वक लॉगआउट हो गया।');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        assignedWorkspaceId,
        isCollector,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

