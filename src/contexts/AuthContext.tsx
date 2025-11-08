import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../supabase/supabase-structure';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  refreshProfile: () => Promise<void>;
  getUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, try to get the current user (this will refresh token if needed)
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          // If getUser fails, try getSession as fallback
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error restoring session:', sessionError);
          }
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              await loadProfile(session.user.id);
              localStorage.setItem('supabase_user_id', session.user.id);
            } else {
              setUser(null);
              setProfile(null);
              localStorage.removeItem('supabase_user_id');
            }
          }
        } else if (mounted) {
          // User retrieved successfully
          if (currentUser) {
            setUser(currentUser);
            await loadProfile(currentUser.id);
            localStorage.setItem('supabase_user_id', currentUser.id);
          } else {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('supabase_user_id');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('supabase_user_id');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;


        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          localStorage.setItem('supabase_user_id', session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('supabase_user_id');
        }

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('supabase_user_id');
        } else if (event === 'TOKEN_REFRESHED') {
          // Session was refreshed, ensure user state is updated
          if (session?.user) {
            setUser(session.user);
          }
        }
      }
    );

    // Set up periodic session refresh check
    const refreshInterval = setInterval(async () => {
      if (!mounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if session is about to expire (within 5 minutes)
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            if (expiresIn < 300 && expiresIn > 0) {
              // Refresh session if it's about to expire (getUser will trigger refresh)
              const { data: { user: refreshedUser } } = await supabase.auth.getUser();
              if (refreshedUser && mounted) {
                setUser(refreshedUser);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    }, 60000); // Check every minute

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const getUserId = () => {
    return user?.id || null;
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    initialized,
    refreshProfile,
    getUserId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

