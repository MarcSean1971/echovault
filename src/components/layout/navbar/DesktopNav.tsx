
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
    <div className="grid grid-cols-3 items-center w-full">
      {/* Left section - Navigation menu */}
      <NavigationMenu className="col-start-1">
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
      
      {/* Center section - Check In button */}
      <div className="flex justify-center col-start-2 mx-auto">
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
      <div className="flex justify-end col-start-3">
        <UserMenu userImage={userImage} initials={initials} />
      </div>
    </div>
  );
}
