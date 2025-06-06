
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, MessageSquare, Users, Settings, LogOut, User, Share } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import { shareEchoVault } from "@/utils/shareUtils";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { getButtonHoverClasses, getIconHoverClasses } = useHoverEffects();
  const [open, setOpen] = useState(false);

  // Check if a path is active
  const isActive = (path: string) => location.pathname === path;
  
  // Handle navigation and close menu
  const handleNavigation = () => {
    setOpen(false);
  };
  
  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Sign out clicked");
    setOpen(false);
    await signOut();
  };

  // Handle share
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    await shareEchoVault();
  };
  
  // Check if user has admin access
  const isAdmin = user?.email === "marc.s@seelenbinderconsulting.com";
  
  return (
    <div className="flex md:hidden items-center space-x-2 justify-end">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${getButtonHoverClasses('ghost')}`}
          >
            <Menu className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="backdrop-blur-xl bg-background/95 border-l">
          <nav className="flex flex-col h-full py-6">
            <div className="flex items-center justify-center mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EchoVault
              </span>
            </div>
            
            <div className="space-y-1 px-1">
              <Link 
                to="/" 
                onClick={handleNavigation}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                  isActive("/") && "bg-accent/15 text-accent"
                )}
              >
                <Home className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/messages" 
                onClick={handleNavigation}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                  isActive("/messages") && "bg-accent/15 text-accent"
                )}
              >
                <MessageSquare className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                <span>Messages</span>
              </Link>
              
              <Link 
                to="/recipients" 
                onClick={handleNavigation}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                  isActive("/recipients") && "bg-accent/15 text-accent"
                )}
              >
                <Users className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                <span>Recipients</span>
              </Link>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10 text-left"
              >
                <Share className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                <span>Share EchoVault</span>
              </button>
              
              <Link 
                to="/profile" 
                onClick={handleNavigation}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                  isActive("/profile") && "bg-accent/15 text-accent"
                )}
              >
                <User className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                <span>Profile</span>
              </Link>
              
              {/* Add Admin Dashboard link for admin users */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                    isActive("/admin") && "bg-accent/15 text-accent"
                  )}
                >
                  <Settings className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
            
            <div className="mt-auto">
              <div className="border-t border-border pt-4 mt-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10 text-left"
                >
                  <LogOut className={`h-5 w-5 ${getIconHoverClasses('muted')}`} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
