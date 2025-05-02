
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { Check } from "lucide-react";
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
    <div className="flex items-center w-full relative">
      {/* Left section - Navigation menu */}
      <div className="flex-1">
        <NavigationMenu>
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className={navigationMenuTriggerStyle() + " nav-link relative transition-all group"}
              >
                <Link to="/messages" className="relative">
                  Messages
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className={navigationMenuTriggerStyle() + " nav-link relative transition-all group"}
              >
                <Link to="/recipients" className="relative">
                  Recipients
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Center section - Check In button - positioned absolutely for true centering */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Button 
          asChild 
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 pulse-subtle px-6 py-2 animate-pulse-light"
          size="lg"
        >
          <Link to="/check-in" className="flex items-center gap-2 font-medium">
            <Check className="h-5 w-5" />
            Check In
          </Link>
        </Button>
      </div>
      
      {/* Right section - User avatar/menu */}
      <div className="flex-1 flex justify-end">
        <UserMenu userImage={userImage} initials={initials} />
      </div>
    </div>
  );
}
