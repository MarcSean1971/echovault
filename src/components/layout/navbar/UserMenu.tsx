
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, Users, MessageSquare, Home, Share } from "lucide-react";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { shareEchoVault } from "@/utils/shareUtils";

interface UserMenuProps {
  userImage: string | null;
  initials: string;
}

export function UserMenu({ userImage, initials }: UserMenuProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Sign out clicked");
    await signOut();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    await shareEchoVault();
  };

  // Check if user has admin access
  const isAdmin = user?.email === "marc.s@seelenbinderconsulting.com";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className="relative h-12 w-12 rounded-full border-2 border-border/60 cursor-pointer focus:outline-none hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"
          role="button"
          tabIndex={0}
        >
          <Avatar className="h-11 w-11 rounded-full">
            {userImage ? (
              <AvatarImage src={userImage} alt="Profile picture" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover shadow-md" align="end" forceMount sideOffset={8} side="bottom">
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/" className="w-full cursor-pointer hover:opacity-90 transition-opacity">
              <Home className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
              <span>Home</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/messages" className="w-full cursor-pointer hover:opacity-90 transition-opacity">
              <MessageSquare className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
              <span>Messages</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/recipients" className="w-full cursor-pointer hover:opacity-90 transition-opacity">
              <Users className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
              <span>Recipients</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare} className="cursor-pointer hover:opacity-90 transition-opacity">
            <Share className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
            <span>Share EchoVault</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="w-full cursor-pointer hover:opacity-90 transition-opacity">
              <User className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin" className="w-full cursor-pointer hover:opacity-90 transition-opacity">
                <Settings className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:opacity-90 transition-opacity">
          <LogOut className={`mr-2 h-4 w-4 ${ICON_HOVER_EFFECTS.muted}`} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
