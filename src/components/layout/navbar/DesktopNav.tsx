
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
      <NavigationMenu>
        <NavigationMenuList>
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
        </NavigationMenuList>
      </NavigationMenu>
      
      <div className="flex-1 flex justify-center">
        <UserMenu userImage={userImage} initials={initials} />
      </div>
      
      <Button 
        asChild 
        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        size="sm"
      >
        <Link to="/check-in">Check In</Link>
      </Button>
    </div>
  );
}
