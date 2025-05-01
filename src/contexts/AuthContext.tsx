
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  user?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerk = useClerkAuth();
  const userResult = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (clerk.isLoaded) {
      setIsAuthenticated(clerk.isSignedIn || false);
    }
  }, [clerk.isLoaded, clerk.isSignedIn]);

  const value = {
    isLoaded: clerk.isLoaded,
    isSignedIn: isAuthenticated,
    userId: clerk.userId,
    user: userResult.user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
