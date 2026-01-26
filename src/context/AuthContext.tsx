import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password?: string, mode?: 'password' | 'magic') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      const profilesTable = (import.meta as any).env?.VITE_SUPABASE_PROFILES_TABLE || 'profiles';

      const ensureProfileExists = async () => {
        const { data: u } = await sb.auth.getUser();
        const user = u?.user;
        if (!user) return;
        // First, try direct id match
        const { data: prof, error } = await sb.from(profilesTable).select('id,email').eq('id', user.id).maybeSingle();
        if (error) return; // don't block on transient errors
        if (prof) return;
        // If not found by id, try by email and link the row
        const userEmail = user.email;
        if (!userEmail) {
          toast.error('Your profile is missing. Please contact an administrator.');
          await sb.auth.signOut();
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
          return;
        }
        const { data: byEmail } = await sb.from(profilesTable).select('id,email').ilike('email', userEmail);
        const first = Array.isArray(byEmail) ? byEmail[0] : null;
        if (first) {
          // Link this profile row to the auth user id
          await sb.from(profilesTable).update({ id: user.id }).eq('email', userEmail);
          return;
        }
        // Still not found
        toast.error('Your profile is missing. Please contact an administrator.');
        await sb.auth.signOut();
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      };

      sb.auth.getSession().then(({ data }) => {
        setIsAuthenticated(!!data.session);
        if (data.session) ensureProfileExists();
      });
      const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          ensureProfileExists().finally(() => navigate('/', { replace: true }));
        }
      });
      return () => { sub.subscription.unsubscribe(); };
    } else {
      const token = localStorage.getItem('churchhub_auth');
      setIsAuthenticated(!!token);
    }
  }, []);

  const login = (email: string, password?: string, mode: 'password' | 'magic' = 'password') => {
    const sb = getSupabase();
    if (sb) {
      if (mode === 'magic' || !password) {
        sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
          .then(({ error }) => {
            if (error) {
              toast.error(error.message);
            } else {
              toast.success('Magic link sent! Check your email to sign in.');
            }
          });
        return;
      }
      sb.auth.signInWithPassword({ email, password })
        .then(({ data, error }) => {
          if (error) {
            toast.error(error.message);
            return;
          }
          if (data.session) {
            toast.success('Signed in');
            navigate('/', { replace: true });
          }
        });
      return;
    }
    // Fallback: local demo
    localStorage.setItem('churchhub_auth', JSON.stringify({ email, ts: Date.now() }));
    setIsAuthenticated(true);
    navigate('/', { replace: true });
  };

  const logout = () => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut().finally(() => {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      });
      return;
    }
    localStorage.removeItem('churchhub_auth');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
