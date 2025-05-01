
import { useAuth, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [initials, setInitials] = useState("U");
  const [userImage, setUserImage] = useState<string | null>(null);

  // Determine user initials and image when user data is loaded
  useEffect(() => {
    if (user) {
      // Get first letter of first and last name if available
      const firstInitial = user.firstName ? user.firstName[0] : "";
      const lastInitial = user.lastName ? user.lastName[0] : "";
      setInitials((firstInitial + lastInitial).toUpperCase() || "U");
      
      // Set user image if available
      setUserImage(user.imageUrl);
    }
  }, [user]);

  // Use the auth check from Clerk if available, otherwise fall back to prop
  const authenticated = isLoaded ? isSignedIn : isLoggedIn;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          
          {/* Desktop navigation */}
          {authenticated && <DesktopNav userImage={userImage} initials={initials} />}
        </div>

        {authenticated ? (
          <MobileNav userImage={userImage} initials={initials} />
        ) : (
          <GuestNav />
        )}
      </div>
    </header>
  );
}
