
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DesktopNavProps {
  userImage: string | null;
  initials: string;
}

export function DesktopNav({ userImage, initials }: DesktopNavProps) {
  return (
    <>
      <nav className="hidden md:flex space-x-6">
        <Link to="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Link to="/create-message" className="text-foreground/80 hover:text-primary transition-colors">
          Messages
        </Link>
        <Link to="/upload-file" className="text-foreground/80 hover:text-primary transition-colors">
          Files
        </Link>
        <Link to="/recipients" className="text-foreground/80 hover:text-primary transition-colors">
          Recipients
        </Link>
      </nav>
      
      <div className="hidden md:flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
          <Link to="/check-in">Check In</Link>
        </Button>
        
        <Avatar className="h-9 w-9 transition-transform hover:scale-105">
          {userImage ? (
            <AvatarImage src={userImage} alt="User profile" />
          ) : (
            <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </>
  );
}
