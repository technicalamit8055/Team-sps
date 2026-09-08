import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'admin' | 'manager' | 'worker' | 'citizen';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: {
    username: string;
    full_name: string;
    ward_number: number | null;
    phone: string | null;
  } | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData) {
        setRole(roleData.role as AppRole);
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name, ward_number, phone')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Convert username to proxy email
      const proxyEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@victory.local`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email: proxyEmail,
        password: password
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'गलत Username या Password। कृपया पुनः प्रयास करें।' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Login failed. Please try again.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, isLoading, signIn, signOut }}>
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
