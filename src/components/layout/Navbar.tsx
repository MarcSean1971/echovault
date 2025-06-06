import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";
import { HeaderButtonsLoader } from "./navbar/header-buttons/HeaderButtonsLoader";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const isMobile = useIsMobile();
  
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
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm md:py-3 py-2 md:h-auto">
      <div className="container mx-auto px-4 flex items-center justify-between relative">
        <Logo />
        
        {/* Desktop navigation */}
        {authenticated && (
          <div className="hidden md:block flex-1">
            <DesktopNav userImage={userImage} initials={initials} />
          </div>
        )}
        
        {/* Centered buttons - only show on desktop */}
        {authenticated && !isMobile && (
          <div className="flex-1 flex justify-center md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-20">
            <HeaderButtonsLoader />
          </div>
        )}
        
        {/* Mobile navigation */}
        <div className="md:hidden flex justify-end">
          {authenticated ? (
            <MobileNav userImage={userImage} initials={initials} />
          ) : (
            // Only show GuestNav on desktop when not authenticated
            !isMobile && <GuestNav />
          )}
        </div>
        
        {/* Desktop guest navigation - show GuestNav when on desktop and not authenticated */}
        {!authenticated && !isMobile && (
          <div className="hidden md:flex">
            <GuestNav />
          </div>
        )}
      </div>
      
      {/* Second line for mobile buttons */}
      {authenticated && isMobile && (
        <div className="md:hidden border-t border-border/40 py-2">
          <div className="container mx-auto px-4 flex justify-center">
            <HeaderButtonsLoader />
          </div>
        </div>
      )}
    </header>
  );
}
