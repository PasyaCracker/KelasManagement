import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('school_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('school_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, nama, role')
      .eq('username', username)
      .eq('password_hash', password)
      .maybeSingle();

    if (error) return { error: 'Terjadi kesalahan sistem' };
    if (!data) return { error: 'Username atau password salah' };

    const userData: User = {
      id: data.id,
      username: data.username,
      nama: data.nama,
      role: data.role,
    };

    localStorage.setItem('school_user', JSON.stringify(userData));
    setUser(userData);
    return { error: null };
  };

  const logout = () => {
    localStorage.removeItem('school_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
