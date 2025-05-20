
import { UserMenu } from "./UserMenu";

interface DesktopNavProps {
  userImage: string | null;
  initials: string;
}

export function DesktopNav({ userImage, initials }: DesktopNavProps) {
  return (
    <div className="flex items-center w-full">
      {/* Left section - intentionally left empty */}
      <div className="flex-1"></div>
      
      {/* Right section - User avatar/menu */}
      <div className="flex justify-end">
        <UserMenu userImage={userImage} initials={initials} />
      </div>
    </div>
  );
}
