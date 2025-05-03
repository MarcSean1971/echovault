
import { UserMenu } from "./UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, MessageSquare, Users, Bell, Settings, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  const location = useLocation();
  const { getButtonHoverClasses } = useHoverEffects();

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to="/" className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium hover:opacity-90 transition-opacity",
                    isActive("/") && "bg-accent/15 text-accent"
                  )}>
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to="/messages" className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium hover:opacity-90 transition-opacity",
                    isActive("/messages") && "bg-accent/15 text-accent"
                  )}>
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to="/recipients" className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium hover:opacity-90 transition-opacity",
                    isActive("/recipients") && "bg-accent/15 text-accent"
                  )}>
                    <Users className="h-5 w-5" />
                    <span>Recipients</span>
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to="/check-in" className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium hover:opacity-90 transition-opacity",
                    isActive("/check-in") && "bg-accent/15 text-accent"
                  )}>
                    <Bell className="h-5 w-5" />
                    <span>Check In</span>
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to="/profile" className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg font-medium hover:opacity-90 transition-opacity",
                    isActive("/profile") && "bg-accent/15 text-accent"
                  )}>
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </div>
            
            <div className="mt-auto space-y-4">
              <Button className={`w-full bg-gradient-to-r from-primary to-accent shadow-md flex items-center gap-2 ${getButtonHoverClasses()}`} asChild>
                <Link to="/check-in">
                  <Check className="h-4 w-4" />
                  Check In Now
                </Link>
              </Button>
              
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
