'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setUser(u);
      setLoading(false);

      // Set/clear server-side session cookie
      if (u) {
        const { getIdToken } = await import('@/lib/firebase/auth');
        const idToken = await getIdToken();
        if (idToken) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        }
      } else {
        await fetch('/api/auth', { method: 'DELETE' });
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
