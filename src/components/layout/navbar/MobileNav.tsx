
import { UserMenu } from "./UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, MessageSquare, Users, Bell, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  const location = useLocation();

  // Check if a path is active
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="flex md:hidden items-center space-x-2">
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
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              
              <Link to="/messages" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/messages") && "bg-accent/15 text-accent"
              )}>
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </Link>
              
              <Link to="/recipients" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/recipients") && "bg-accent/15 text-accent"
              )}>
                <Users className="h-5 w-5" />
                <span>Recipients</span>
              </Link>
              
              <Link to="/check-in" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/check-in") && "bg-accent/15 text-accent"
              )}>
                <Bell className="h-5 w-5" />
                <span>Check In</span>
              </Link>
              
              <Link to="/profile" className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all duration-200 hover:bg-accent/10",
                isActive("/profile") && "bg-accent/15 text-accent"
              )}>
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
            
            <div className="mt-auto">
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between p-2">
                  <div className="text-sm font-medium">Account</div>
                  <UserMenu userImage={userImage} initials={initials} />
                </div>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
