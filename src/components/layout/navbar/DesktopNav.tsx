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
