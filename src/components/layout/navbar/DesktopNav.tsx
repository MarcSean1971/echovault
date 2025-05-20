
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
              <Link to="/messages">
                <NavigationMenuLink className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </NavigationMenuLink>
              </Link>
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
