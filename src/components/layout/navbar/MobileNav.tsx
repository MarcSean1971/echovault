
import { useState } from "react";
import { Menu, X, User, LogOut, CreditCard, Shield, Home, MessageSquare, BarChart3, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsOpen(false);
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isAdmin = profile?.email === 'admin@echovault.app';

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 w-screen bg-background border-t shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* User Profile Section */}
            <div className="flex items-center space-x-3 pb-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userImage || undefined} alt="User avatar" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/dashboard')}
              >
                <Home className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/messages')}
              >
                <MessageSquare className="mr-3 h-4 w-4" />
                Messages
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/recipients')}
              >
                <Users className="mr-3 h-4 w-4" />
                Recipients
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/profile')}
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/subscription')}
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Subscription
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/admin')}
                >
                  <Shield className="mr-3 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
