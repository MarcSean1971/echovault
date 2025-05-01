
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");

  // Determine user initials and image when user data is loaded
  useEffect(() => {
    if (profile) {
      setInitials(getInitials());
      setUserImage(profile.avatar_url);
    } else {
      setInitials("U");
      setUserImage(null);
    }
  }, [profile, getInitials]);

  // Use the auth check from context if available, otherwise fall back to prop
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
