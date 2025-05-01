
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface DesktopNavProps {
  userImage: string | null;
  initials: string;
}

export function DesktopNav({ userImage, initials }: DesktopNavProps) {
  return (
    <>
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to="/dashboard">Dashboard</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to="/messages">Messages</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to="/recipients">Recipients</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to="/check-ins">Check-ins</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
      <div className="hidden md:flex items-center space-x-4">
        <Button 
          asChild 
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          size="sm"
        >
          <Link to="/check-in">Check In</Link>
        </Button>
        
        <Avatar className="h-9 w-9 transition-transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/20">
          {userImage ? (
            <AvatarImage src={userImage} alt="User profile" />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          )}
        </Avatar>
      </div>
    </>
  );
}
