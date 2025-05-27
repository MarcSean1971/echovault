
import { User, LogOut, Settings, CreditCard, Shield, Home, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UserMenuProps {
  userImage: string | null;
  initials: string;
}

export function UserMenu({ userImage, initials }: UserMenuProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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

  const isAdmin = profile?.email === 'admin@echovault.app';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <AvatarImage src={userImage || undefined} alt="User avatar" />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Main Navigation Items */}
        <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-primary/10 transition-colors">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer hover:bg-primary/10 transition-colors">
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/recipients')} className="cursor-pointer hover:bg-primary/10 transition-colors">
          <Users className="mr-2 h-4 w-4" />
          Recipients
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Account Settings */}
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-primary/10 transition-colors">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer hover:bg-primary/10 transition-colors">
          <CreditCard className="mr-2 h-4 w-4" />
          Subscription
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer hover:bg-primary/10 transition-colors">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
