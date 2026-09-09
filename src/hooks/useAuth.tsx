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

const LOCAL_SESSION_KEY = 'victory_demo_auth_session_v1';

// Helper to fetch staff member by username from local master staff store
export const getStaffMemberByUsername = (username: string) => {
  const cleanUser = (username || '').toLowerCase().trim();
  if (!cleanUser) return null;
  try {
    const rawStaff = localStorage.getItem('victory_master_staff_v1');
    if (rawStaff) {
      const staffList = JSON.parse(rawStaff);
      if (Array.isArray(staffList)) {
        return staffList.find((s: any) => s?.username?.toLowerCase() === cleanUser) || null;
      }
    }
  } catch (e) {
    console.warn('Error reading staff by username:', e);
  }
  return null;
};

// Helper to determine if a username belongs to an assigned collector worker
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

  // Default fallback for sunil_collector
  if (cleanUser.includes('collector') || cleanUser === 'sunil_collector') {
    return { assignedWorkspaceId: 'ent-durga-narayanpur', isCollector: true, staffName: 'सुनील वर्मा' };
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

  const fetchUserData = async (userId: string, overrideUsername?: string) => {
    try {
      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      let fetchedRole: AppRole = 'worker';
      if (roleData) {
        fetchedRole = roleData.role as AppRole;
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
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Check local demo session first if Supabase is offline or using demo staff
    const checkLocalSession = () => {
      try {
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.user && parsed.role) {
            setUser(parsed.user);
            setRole(parsed.role);
            setProfile(parsed.profile);
            setAssignedWorkspaceId(parsed.assignedWorkspaceId || null);
            setIsCollector(!!parsed.isCollector);
            setIsLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.warn('Failed to parse local demo session:', e);
      }
      return false;
    };

    const hasLocal = checkLocalSession();

    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          localStorage.removeItem(LOCAL_SESSION_KEY);
          setSession(session);
          setUser(session.user);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else if (!hasLocal) {
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

    if (!hasLocal) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          fetchUserData(session.user.id);
        }
        setIsLoading(false);
      });
    }

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
        // Fallback for pre-configured staff accounts or any staff created in Master OS
        const localStaff = getStaffMemberByUsername(cleanUser);
        const isCollector = cleanUser === 'sunil_collector' || collectorInfo.isCollector || localStaff?.primaryRole === 'collector';
        const isKnownStaff = !!localStaff || isCollector || cleanUser.includes('admin') || cleanUser.includes('treasurer');

        if (isKnownStaff) {
          // If a specific password is set for this staff member, verify it!
          if (localStaff?.password && localStaff.password.trim() !== '') {
            if (password !== localStaff.password) {
              return { error: 'गलत Password। कृपया सही पासवर्ड दर्ज करें।' };
            }
          }

          const assignedWs = collectorInfo.assignedWorkspaceId ||
            (localStaff ? Object.keys(localStaff.workspacePermissions || {})[0] : null) ||
            (isCollector ? 'ent-durga-narayanpur' : null);

          const detectedRole: AppRole = (localStaff?.primaryRole === 'admin' || cleanUser.includes('admin'))
            ? 'admin'
            : (isCollector ? 'worker' : 'manager');

          const staffDisplayName = localStaff?.name || collectorInfo.staffName || (isCollector ? 'सुनील वर्मा' : cleanUser);
          const staffPhone = localStaff?.phone || (cleanUser === 'sunil_collector' ? '9470123456' : null);

          const mockUser: any = {
            id: localStaff ? `staff-user-${localStaff.id}` : (isCollector ? 'mock-user-sunil-collector' : `mock-user-${cleanUser}`),
            email: proxyEmail,
            created_at: new Date().toISOString(),
          };

          const mockProfile: AuthUserProfile = {
            username: cleanUser,
            full_name: staffDisplayName,
            ward_number: 1,
            phone: staffPhone,
            assigned_workspace_id: assignedWs,
            is_collector: isCollector,
          };

          const demoSessionData = {
            user: mockUser,
            role: detectedRole,
            profile: mockProfile,
            assignedWorkspaceId: assignedWs,
            isCollector: isCollector,
          };

          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoSessionData));
          setUser(mockUser);
          setRole(detectedRole);
          setProfile(mockProfile);
          setAssignedWorkspaceId(assignedWs);
          setIsCollector(isCollector);

          return {
            error: null,
            role: detectedRole,
            assignedWorkspaceId: assignedWs,
            isCollector: isCollector,
          };
        }

        if (error.message.includes('Invalid login credentials')) {
          return { error: 'गलत Username या Password। कृपया पुनः प्रयास करें।' };
        }
        return { error: error.message };
      }

      let userRole: AppRole | null = null;
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);

        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          if (roleData?.role) {
            userRole = roleData.role as AppRole;
            setRole(userRole);
          }
        } catch (e) {
          console.error('Error fetching role in signIn:', e);
        }

        fetchUserData(data.user.id, cleanUser);
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
    localStorage.removeItem(LOCAL_SESSION_KEY);
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAssignedWorkspaceId(null);
    setIsCollector(false);
    toast.success('Logged out successfully');
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

