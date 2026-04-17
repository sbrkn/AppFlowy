'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { onAuthChange, logOut } from '@/lib/firebase/auth';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export { AuthContext };

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    await logOut();
    setUser(null);
  }, []);

  return { user, loading, signOut };
}
