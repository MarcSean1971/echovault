
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";
import { HeaderButtons } from "./navbar/header-buttons";  // Fixed import path
import { useIsMobile } from "@/hooks/use-mobile";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials, userId } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const { conditions } = useTriggerDashboard();
  const isMobile = useIsMobile();

  console.log("Navbar rendering with conditions:", conditions?.length || 0);
  console.log("Navbar userId:", userId);
  
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
            <HeaderButtons 
              conditions={conditions || []}  
              userId={userId}
            />
          </div>
        )}
        
        {/* Mobile navigation */}
        <div className="md:hidden flex justify-end">
          {authenticated ? (
            <MobileNav userImage={userImage} initials={initials} />
          ) : (
            <GuestNav />
          )}
        </div>
      </div>
      
      {/* Second line for mobile buttons */}
      {authenticated && isMobile && (
        <div className="md:hidden border-t border-border/40 py-2">
          <div className="container mx-auto px-4 flex justify-center">
            <HeaderButtons 
              conditions={conditions || []}  
              userId={userId}
            />
          </div>
        </div>
      )}
    </header>
  );
}
