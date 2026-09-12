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

// Helper to determine if a username belongs to an assigned collector worker.
// This reads the locally-cached staff roster purely for authorization/UX
// scoping (which workspace a collector lands on) — it is never used to
// authenticate a login. Real authentication always goes through Supabase Auth.
export const getStaffCollectorInfo = (username: string): { assignedWorkspaceId: string | null; isCollector: boolean; staffName?: string } => {
  const cleanUser = (username || '').toLowerCase().trim();
  if (!cleanUser) return { assignedWorkspaceId: null, isCollector: false };

  try {
    const rawStaff = localStorage.getItem('victory_master_staff_v1');
    if (rawStaff) {
      const staffList = JSON.parse(rawStaff);
      if (Array.isArray(staffList)) {
        const staff = staffList.find(s => s?.username?.toLowerCase() === cleanUser);
        if (staff) {
          // Check if any permission is 'collector'
          const perms = staff.workspacePermissions || {};
          const collectorWs = Object.entries(perms).find(
            ([_, p]: [string, any]) => p?.accessLevel === 'collector'
          );
          if (collectorWs) {
            return { assignedWorkspaceId: collectorWs[0], isCollector: true, staffName: staff.name };
          }
          if (staff.primaryRole === 'collector' || cleanUser.includes('collector')) {
            const firstWs = Object.keys(perms)[0] || 'ent-durga-narayanpur';
            return { assignedWorkspaceId: firstWs, isCollector: true, staffName: staff.name };
          }
          const wsIds = Object.keys(perms);
          if (wsIds.length === 1 && wsIds[0] === 'ent-durga-narayanpur') {
            return { assignedWorkspaceId: 'ent-durga-narayanpur', isCollector: true, staffName: staff.name };
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error reading staff for collector info:', e);
  }

  return { assignedWorkspaceId: null, isCollector: false };
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

  const fetchUserData = async (userId: string, overrideUsername?: string): Promise<AppRole | null> => {
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
      const collectorInfo = getStaffCollectorInfo(username);

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

      return fetchedRole;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up Supabase auth listener — the only source of truth for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Sign-ins are handled end-to-end by signIn() itself (it awaits
        // fetchUserData before returning), so skip this event here to avoid
        // a second, racing fetch that can overwrite state mid-navigation.
        if (event === 'SIGNED_IN') {
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchUserData(session.user.id);
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
    const collectorInfo = getStaffCollectorInfo(cleanUser);

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
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);

        userRole = await fetchUserData(data.user.id, cleanUser);
      }

      return {
        error: null,
        role: userRole,
        assignedWorkspaceId: collectorInfo.assignedWorkspaceId,
        isCollector: collectorInfo.isCollector,
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

