
import { Link } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { MessageSquare } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

interface DesktopNavProps {
  userImage: string | null;
  initials: string;
}

export function DesktopNav({ userImage, initials }: DesktopNavProps) {
  return (
    <div className="flex items-center w-full">
      {/* Left section - Navigation menu */}
      <div className="flex-1">
        <NavigationMenu>
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <NavigationMenuLink 
                asChild 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-green-600 text-white px-8 h-11 shadow-sm hover:bg-green-700 hover:-translate-y-0.5 duration-200"
              >
                <Link to="/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      {/* Right section - User avatar/menu */}
      <div className="flex justify-end">
        <UserMenu userImage={userImage} initials={initials} />
      </div>
    </div>
  );
}
