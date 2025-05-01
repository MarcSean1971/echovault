
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { setSupabaseToken } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

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
      // Try to get a JWT with the supabase template first
      try {
        const token = await clerk.getToken({
          template: "supabase" // First try with supabase template
        });
        return token;
      } catch (templateError) {
        console.warn("Supabase template not found, falling back to default token");
        // Fall back to default token if supabase template doesn't exist
        const token = await clerk.getToken();
        return token;
      }
    } catch (error) {
      console.error("Error getting token:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to get authentication token. Please try signing in again.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (clerk.isLoaded) {
      setIsAuthenticated(clerk.isSignedIn || false);
      
      // Update the Supabase token when auth state changes
      if (clerk.isSignedIn) {
        getToken().then(token => {
          if (token) {
            console.log("Setting Supabase token");
            setSupabaseToken(token);
          } else {
            console.warn("No token available from Clerk");
            setSupabaseToken(null);
          }
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
