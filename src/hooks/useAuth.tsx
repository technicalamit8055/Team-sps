import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
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

// How long a single startup network call may take before the app stops waiting
// on it. Supabase cold starts and slow mobile links used to leave the whole app
// parked on a spinner with no upper bound.
const AUTH_REQUEST_TIMEOUT_MS = 3000;

// Hard cap on the whole auth initialisation. Whatever is still outstanding when
// this fires, isLoading is released so the user is never trapped on a spinner.
const AUTH_INIT_TIMEOUT_MS = 3500;

/**
 * Resolves to `fallback` if `promise` has not settled within `ms`.
 *
 * The underlying request is not cancelled — it keeps running and its result is
 * simply ignored, which is what we want: the slow answer may still land and be
 * applied by a later state update, it just no longer holds up first paint.
 */
const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  new Promise<T>(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, ms);

    promise
      .then(value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      });
  });

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
 *
 * A request slower than AUTH_REQUEST_TIMEOUT_MS is treated the same way — as
 * inconclusive rather than as a rejection — so a cold Supabase instance cannot
 * hold the app on a spinner. The check still runs to completion in the
 * background, and a genuine rejection is caught by the next token refresh.
 */
const isAccountStillValid = async (): Promise<boolean> => {
  try {
    const result = await withTimeout(
      supabase.auth.getUser(),
      AUTH_REQUEST_TIMEOUT_MS,
      null
    );

    // Timed out: inconclusive, so keep the local session rather than blocking.
    if (!result) return true;

    const { data, error } = result;
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

// Cached display fields for the last signed-in account, keyed by user id.
//
// Deliberately excludes `role`, `assigned_workspace_id`, `is_collector` and
// `can_choose_collector_name`. Those decide who reaches Master OS and who may
// delete receipts, and localStorage is editable by whoever holds the device —
// hydrating them from here would let a collector promote themselves to admin
// by editing a key. They stay resolved from Supabase on every load, exactly as
// fetchStaffCollectorInfo already requires. What is cached here only fills in
// the name and phone shown in the UI a little sooner.
const PROFILE_CACHE_KEY = 'sps.auth.profile.v1';

interface CachedProfile {
  userId: string;
  username: string;
  full_name: string;
  ward_number: number | null;
  phone: string | null;
}

const readCachedProfile = (userId: string): AuthUserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedProfile;
    if (!cached || cached.userId !== userId) return null;
    return {
      username: cached.username,
      full_name: cached.full_name,
      ward_number: cached.ward_number,
      phone: cached.phone,
      // Scoping is never restored from cache — it is left unset until Supabase
      // answers, so no privilege can be inferred from local storage.
      assigned_workspace_id: null,
      is_collector: false,
      can_choose_collector_name: false,
    };
  } catch {
    return null;
  }
};

const writeCachedProfile = (userId: string, profile: AuthUserProfile) => {
  try {
    const payload: CachedProfile = {
      userId,
      username: profile.username,
      full_name: profile.full_name,
      ward_number: profile.ward_number,
      phone: profile.phone,
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode or a full quota — the cache is an optimisation only.
  }
};

const clearCachedProfile = () => {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Ignore: nothing depends on the cache being cleared successfully.
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
      // Role and profile are independent lookups, so they go out together.
      // Run in sequence they added a full round-trip to every page load that
      // sits behind a protected route.
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
        supabase
          .from('profiles')
          .select('username, full_name, ward_number, phone')
          .eq('id', userId)
          .single(),
      ]);

      const fetchedRole = (roleData?.role as AppRole) ?? null;
      if (fetchedRole) {
        setRole(fetchedRole);
      }

      const username = profileData?.username || overrideUsername || '';
      // Authoritative lookup against Supabase, so a member signing in on a
      // device for the first time is recognised as scoped to their assigned
      // unit on the very first render.
      const collectorInfo = await fetchStaffCollectorInfo(username, userId, fetchedRole);

      if (profileData) {
        const resolvedProfile: AuthUserProfile = {
          ...profileData,
          assigned_workspace_id: collectorInfo.assignedWorkspaceId,
          is_collector: collectorInfo.isCollector,
          can_choose_collector_name: collectorInfo.canChooseCollectorName,
        };
        setProfile(resolvedProfile);
        // Only the display fields are kept; see PROFILE_CACHE_KEY.
        writeCachedProfile(userId, resolvedProfile);
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
    clearCachedProfile();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAssignedWorkspaceId(null);
    setIsCollector(false);
    setCanChooseCollectorName(false);
  };

  // Guards against the two startup paths (onAuthStateChange's replayed INITIAL
  // session and getSession) both resolving the same session, which used to fire
  // duplicate concurrent round-trips to Supabase on every cold load.
  const didInitRef = useRef(false);
  // Set once isLoading has been released, so a late-arriving response cannot
  // put the app back on the spinner after the failsafe has already let it go.
  const didFinishLoadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const finishLoading = () => {
      if (cancelled) return;
      didFinishLoadingRef.current = true;
      setIsLoading(false);
    };

    // Failsafe: whatever is still in flight, the app stops blocking here. A
    // cold Supabase instance or a stalled mobile connection can no longer leave
    // the user on an indefinite spinner — the guards evaluate against whatever
    // resolved, and the outstanding requests still apply their results when
    // they land.
    const failsafe = setTimeout(() => {
      if (didFinishLoadingRef.current) return;
      console.warn('Auth initialisation timed out; rendering with resolved state.');
      finishLoading();
    }, AUTH_INIT_TIMEOUT_MS);

    // Resolves a session found at startup, from whichever path reaches it
    // first. Runs at most once per mount.
    const initializeSession = async (session: Session) => {
      // getSession only reads localStorage, so a deleted account would look
      // signed in. Validate against the server before trusting the session,
      // otherwise a revoked device stays usable until its token expires.
      if (!(await isAccountStillValid())) {
        await clearLocalSession();
        finishLoading();
        toast.error('यह खाता अब मौजूद नहीं है। कृपया व्यवस्थापक से संपर्क करें।');
        return;
      }

      if (cancelled) return;

      setSession(session);
      setUser(session.user);
      // Show the cached name straight away so the header is not blank while the
      // authoritative lookup runs. Scoping stays unset until Supabase answers.
      const cached = readCachedProfile(session.user.id);
      if (cached) setProfile(prev => prev ?? cached);

      // Await before clearing isLoading — otherwise a refresh renders the
      // wrong dashboard for a moment before the unit assignment arrives. The
      // failsafe above bounds how long this can hold the UI.
      await fetchUserData(session.user.id);
    };

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
          // The initial session replayed to a new listener is the same one
          // getSession() returns. Let whichever arrives first own it, so the
          // startup lookups are not issued twice over the network.
          if (event === 'INITIAL_SESSION') {
            if (didInitRef.current) return;
            didInitRef.current = true;
            await initializeSession(session);
            finishLoading();
            return;
          }

          // Re-check on every token refresh: this is the point at which an
          // account deleted while the app was open gets thrown out, without
          // waiting for the user to reload.
          if (event === 'TOKEN_REFRESHED' && !(await isAccountStillValid())) {
            await clearLocalSession();
            finishLoading();
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
          // A signed-out event settles startup too — there is nothing to fetch.
          didInitRef.current = true;
          clearCachedProfile();
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          setAssignedWorkspaceId(null);
          setIsCollector(false);
          setCanChooseCollectorName(false);
        }
        finishLoading();
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Already handled by the listener's INITIAL_SESSION — nothing to redo.
      if (didInitRef.current) return;
      didInitRef.current = true;

      if (session) {
        await initializeSession(session);
      }
      finishLoading();
    });

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
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
    clearCachedProfile();
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

