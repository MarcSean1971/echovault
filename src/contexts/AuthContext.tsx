
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { setSupabaseToken } from '@/lib/supabaseClient';

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  user?: any;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clerk = useClerkAuth();
  const userResult = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Function to get the JWT from Clerk
  const getToken = async () => {
    if (!clerk.isSignedIn) return null;
    try {
      // Get a JWT that is configured for use with Supabase
      const token = await clerk.getToken({
        template: "supabase" // This requires Clerk JWT Templates setup - default template will be used if not configured
      });
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (clerk.isLoaded) {
      setIsAuthenticated(clerk.isSignedIn || false);
      
      // Update the Supabase token when auth state changes
      if (clerk.isSignedIn) {
        getToken().then(token => {
          setSupabaseToken(token);
        });
      } else {
        setSupabaseToken(null);
      }
    }
  }, [clerk.isLoaded, clerk.isSignedIn]);

  const value = {
    isLoaded: clerk.isLoaded,
    isSignedIn: isAuthenticated,
    userId: clerk.userId,
    user: userResult.user,
    getToken
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
