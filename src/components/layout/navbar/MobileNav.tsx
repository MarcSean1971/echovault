
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  return (
    <div className="flex md:hidden items-center space-x-3">
      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>
      
      <UserMenu userImage={userImage} initials={initials} />
    </div>
  );
}
