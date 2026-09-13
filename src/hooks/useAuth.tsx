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
  can_choose_collector_name?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: AuthUserProfile | null;
  assignedWorkspaceId: string | null;
  isCollector: boolean;
  /**
   * May this account pick the संग्रहकर्ता per receipt rather than having it
   * locked to the account holder? Granted by the `chooseCollectorName` module
   * permission. Resolved straight from Supabase at sign in, so it holds on a
   * device whose staff roster has not synced yet.
   */
  canChooseCollectorName: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{
    error: string | null;
    role?: AppRole | null;
    assignedWorkspaceId?: string | null;
    isCollector?: boolean;
    canChooseCollectorName?: boolean;
  }>;
  signOut: () => Promise<void>;
}

// Resolved unit scoping for a staff member.
interface CollectorInfo {
  assignedWorkspaceId: string | null;
  isCollector: boolean;
  canChooseCollectorName: boolean;
  staffName?: string;
}

// Derives the collector assignment for a staff member from their workspace
// permission map, as stored in Supabase.
const deriveCollectorInfo = (
  staff: {
    name?: string;
    username?: string;
    primaryRole?: string;
    workspacePermissions?: Record<
      string,
      { accessLevel?: string; modules?: { chooseCollectorName?: boolean } }
    >;
  } | null | undefined
): CollectorInfo => {
  if (!staff) {
    return { assignedWorkspaceId: null, isCollector: false, canChooseCollectorName: false };
  }

  const perms = staff.workspacePermissions || {};

  // Granted on any workspace, the unlock applies to the account: which unit is
  // selected must not change whose name a receipt can be credited to.
  const canChooseCollectorName = Object.values(perms).some(
    p => p?.modules?.chooseCollectorName === true
  );

  // An explicit 'collector' access level on any workspace is the strongest
  // signal that the account is scoped to that single unit.
  const collectorWs = Object.entries(perms).find(([, p]) => p?.accessLevel === 'collector');
  if (collectorWs) {
    return {
      assignedWorkspaceId: collectorWs[0],
      isCollector: true,
      canChooseCollectorName,
      staffName: staff.name,
    };
  }

  const wsIds = Object.keys(perms);

  if (staff.primaryRole === 'collector') {
    return {
      assignedWorkspaceId: wsIds[0] || 'ent-durga-narayanpur',
      isCollector: true,
      canChooseCollectorName,
      staffName: staff.name,
    };
  }

  // A member assigned to exactly one non-election workspace is scoped to that
  // unit, regardless of the access level they hold inside it.
  if (wsIds.length === 1 && wsIds[0] !== 'ent-election-2026') {
    return {
      assignedWorkspaceId: wsIds[0],
      isCollector: true,
      canChooseCollectorName,
      staffName: staff.name,
    };
  }

  return { assignedWorkspaceId: null, isCollector: false, canChooseCollectorName };
};

// Scoping that grants nothing. Returned whenever the roster cannot be read, so
// a failed lookup can never widen access — an account whose permissions could
// not be confirmed is treated as restricted, not as an unscoped one. The name
// unlock is withheld too: a locked name is the safer default, since it credits
// receipts to the signed-in account rather than to a free choice.
const NO_ACCESS_INFO: CollectorInfo = {
  assignedWorkspaceId: null,
  isCollector: true,
  canChooseCollectorName: false,
};

// Collector lookup. Supabase is the only source: the staff roster decides who
// may reach Master OS and delete receipts, so it is never read from
// browser-side storage, which the device holder can edit freely.
export const fetchStaffCollectorInfo = async (
  username: string,
  userId?: string,
  /**
   * The account's role from `user_roles`. Decides how a *missing* roster row is
   * read: unscoped for a real admin/manager, fully restricted for anyone else.
   * Without it, a member deleted from the roster would resolve as an admin.
   */
  appRole?: AppRole | null
): Promise<CollectorInfo> => {
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
          (staffRow.workspace_permissions as Record<
            string,
            { accessLevel?: string; modules?: { chooseCollectorName?: boolean } }
          >) || {},
      });
    }

    // Signed in, but no staff record matched. Genuine admin and manager accounts
    // have no roster row, so those stay unscoped — the route guards still gate
    // Master OS on the Supabase role.
    if (appRole === 'admin' || appRole === 'manager') {
      return { assignedWorkspaceId: null, isCollector: false, canChooseCollectorName: false };
    }

    // Any other account with no roster row was removed from the roster (or never
    // belonged to it). Treat it as fully restricted rather than letting a
    // missing row read as an unscoped admin — deletion must never widen access.
    console.warn('No staff roster row for this account; denying elevated access.');
    return NO_ACCESS_INFO;
  } catch (e) {
    // The roster was unreachable, so the account's restrictions are unknown.
    // Fail closed: assume the most restricted mode rather than handing an
    // unverified device the delete button and Master OS.
    console.warn('Could not resolve collector info from Supabase; denying elevated access:', e);
    return NO_ACCESS_INFO;
  }
};

/**
 * Confirms the signed-in account still exists server-side.
 *
 * A locally stored session keeps working until its access token expires, so an
 * account deleted from the admin panel could otherwise keep using an already
 * open app for up to an hour. `getUser()` validates the token against the
 * server, which fails as soon as the auth user is gone.
 *
 * Returns false only on a definite rejection. A network failure returns true:
 * an offline device must not be logged out just because it cannot reach
 * Supabase, since it could not read any fresh data in that state anyway.
 */
const isAccountStillValid = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      const status = (error as { status?: number }).status;
      // 401/403 mean the token was rejected — deleted user, or revoked session.
      if (status === 401 || status === 403) return false;
      // Any other error (5xx, offline, timeout) is inconclusive.
      return true;
    }
    return Boolean(data?.user);
  } catch {
    return true;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [assignedWorkspaceId, setAssignedWorkspaceId] = useState<string | null>(null);
  const [isCollector, setIsCollector] = useState<boolean>(false);
  const [canChooseCollectorName, setCanChooseCollectorName] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resolves role, profile and collector assignment for a signed-in user.
  // Returns both the role and the resolved collector info so callers (signIn)
  // can route immediately without waiting for a second state round-trip.
  const fetchUserData = async (
    userId: string,
    overrideUsername?: string
  ): Promise<{
    role: AppRole | null;
    assignedWorkspaceId: string | null;
    isCollector: boolean;
    canChooseCollectorName: boolean;
  }> => {
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
      // Authoritative lookup against Supabase, so a member signing in on a
      // device for the first time is recognised as scoped to their assigned
      // unit on the very first render.
      const collectorInfo = await fetchStaffCollectorInfo(username, userId, fetchedRole);

      if (profileData) {
        setProfile({
          ...profileData,
          assigned_workspace_id: collectorInfo.assignedWorkspaceId,
          is_collector: collectorInfo.isCollector,
          can_choose_collector_name: collectorInfo.canChooseCollectorName,
        });
      }

      // Recorded even when the account resolved to no single assigned unit —
      // the name unlock is independent of unit scoping.
      setCanChooseCollectorName(collectorInfo.canChooseCollectorName);

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
        canChooseCollectorName: collectorInfo.canChooseCollectorName,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { role: null, assignedWorkspaceId: null, isCollector: false, canChooseCollectorName: false };
    }
  };

  // Drops every trace of the session from this device. Used when the account
  // turns out to be revoked, so nothing keeps rendering from stale local state.
  const clearLocalSession = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAssignedWorkspaceId(null);
    setIsCollector(false);
    setCanChooseCollectorName(false);
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
          // Re-check on every token refresh: this is the point at which an
          // account deleted while the app was open gets thrown out, without
          // waiting for the user to reload.
          if (event === 'TOKEN_REFRESHED' && !(await isAccountStillValid())) {
            await clearLocalSession();
            setIsLoading(false);
            toast.error('यह खाता अब मौजूद नहीं है। कृपया व्यवस्थापक से संपर्क करें।');
            return;
          }

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
          setCanChooseCollectorName(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // getSession only reads localStorage, so a deleted account would look
        // signed in. Validate against the server before trusting the session,
        // otherwise a revoked device stays usable until its token expires.
        if (!(await isAccountStillValid())) {
          await clearLocalSession();
          setIsLoading(false);
          toast.error('यह खाता अब मौजूद नहीं है। कृपया व्यवस्थापक से संपर्क करें।');
          return;
        }

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
  ): Promise<{
    error: string | null;
    role?: AppRole | null;
    assignedWorkspaceId?: string | null;
    isCollector?: boolean;
    canChooseCollectorName?: boolean;
  }> => {
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
      let resolvedCanChooseName = false;

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
        resolvedCanChooseName = userData.canChooseCollectorName;
      }

      return {
        error: null,
        role: userRole,
        assignedWorkspaceId: resolvedWorkspaceId,
        isCollector: resolvedIsCollector,
        canChooseCollectorName: resolvedCanChooseName,
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
    setCanChooseCollectorName(false);
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
        canChooseCollectorName,
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

