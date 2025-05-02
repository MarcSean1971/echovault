
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
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
    <div className="flex items-center justify-between w-full">
      {/* Left section - Navigation menu */}
      <NavigationMenu>
        <NavigationMenuList className="space-x-1">
          <NavigationMenuItem>
            <NavigationMenuLink 
              asChild 
              className={navigationMenuTriggerStyle() + " transition-all hover:text-primary"}
            >
              <Link to="/messages">Messages</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink 
              asChild 
              className={navigationMenuTriggerStyle() + " transition-all hover:text-primary"}
            >
              <Link to="/recipients">Recipients</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
      {/* Center section - Check In button */}
      <div className="flex-1 flex justify-center">
        <Button 
          asChild 
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-[1px]"
          size="sm"
        >
          <Link to="/check-in">Check In</Link>
        </Button>
      </div>
      
      {/* Right section - User avatar/menu */}
      <UserMenu userImage={userImage} initials={initials} />
    </div>
  );
}
