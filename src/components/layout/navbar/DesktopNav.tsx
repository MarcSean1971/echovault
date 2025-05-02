
import { Link } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ShieldAlert } from "lucide-react";

interface DesktopNavProps {
  userImage: string | null;
  initials: string;
  isAdmin?: boolean;
}

export function DesktopNav({ userImage, initials, isAdmin = false }: DesktopNavProps) {
  return (
    <div className="flex items-center w-full">
      {/* Left section - Navigation menu */}
      <div className="flex-1">
        <NavigationMenu>
          <NavigationMenuList className="space-x-1">
            {/* Show consistent navigation items regardless of admin status */}
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className={navigationMenuTriggerStyle() + " nav-link relative transition-all"}
              >
                <Link to="/messages">
                  Messages
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className={navigationMenuTriggerStyle() + " nav-link relative transition-all"}
              >
                <Link to="/recipients">
                  Recipients
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            {/* Show admin-specific items only for admins */}
            {isAdmin && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    asChild 
                    className={navigationMenuTriggerStyle() + " nav-link relative transition-all"}
                  >
                    <Link to="/admin" className="flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      Admin
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    asChild 
                    className={navigationMenuTriggerStyle() + " nav-link relative transition-all"}
                  >
                    <Link to="/admin/users">
                      Users
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    asChild 
                    className={navigationMenuTriggerStyle() + " nav-link relative transition-all"}
                  >
                    <Link to="/admin/messages">
                      Admin Messages
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Right section - User avatar/menu */}
      <div className="flex justify-end">
        <UserMenu userImage={userImage} initials={initials} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
