
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, MessageSquare, Users, Settings, LogOut, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  // Check if a path is active
  const isActive = (path: string) => location.pathname === path;
  
  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Sign out clicked");
    await signOut();
  };
  
  // Check if user has admin access
  const isAdmin = user?.email === "marc.s@seelenbinderconsulting.com";
  
  return (
    <div className="flex md:hidden items-center space-x-2">
      <Avatar className={`h-10 w-10 border-2 border-border/60 shadow-sm`}>
        {userImage ? (
          <AvatarImage src={userImage} alt="Profile" />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 transition-all duration-200">
            <Menu className="h-5 w-5" />
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
              <Link to="/" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/") && "bg-accent/15 text-accent"
              )}>
                <Home className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
                <span>Home</span>
              </Link>
              
              <Link to="/messages" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/messages") && "bg-accent/15 text-accent"
              )}>
                <MessageSquare className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
                <span>Messages</span>
              </Link>
              
              <Link to="/recipients" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/recipients") && "bg-accent/15 text-accent"
              )}>
                <Users className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
                <span>Recipients</span>
              </Link>
              
              <Link to="/profile" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/profile") && "bg-accent/15 text-accent"
              )}>
                <User className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
                <span>Profile</span>
              </Link>
              
              {/* Add Admin Dashboard link for admin users */}
              {isAdmin && (
                <Link to="/admin" className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                  isActive("/admin") && "bg-accent/15 text-accent"
                )}>
                  <Settings className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
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
                  <LogOut className={`h-5 w-5 ${ICON_HOVER_EFFECTS.muted}`} />
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
