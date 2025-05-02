
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";
import { isAdminEmail } from "@/utils/adminUtils";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials, user } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  
  // Determine if user is an admin
  const isAdmin = user ? isAdminEmail(user.email) : false;

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
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <Logo />
        
        {/* Desktop navigation */}
        {authenticated && (
          <div className="hidden md:block flex-1">
            <DesktopNav userImage={userImage} initials={initials} isAdmin={isAdmin} />
          </div>
        )}
        
        {/* Centered "Check In" button for larger screens only - shown for non-admin users */}
        {authenticated && !isAdmin && (
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-20">
            <Button 
              asChild 
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 pulse-subtle px-6 py-2 animate-pulse-light"
              size="lg"
            >
              <Link to="/check-in" className="flex items-center gap-2 font-medium">
                <Check className="h-5 w-5" />
                Check In
              </Link>
            </Button>
          </div>
        )}

        {/* Mobile navigation */}
        <div className="md:hidden flex flex-1 justify-end">
          {authenticated ? (
            <MobileNav userImage={userImage} initials={initials} isAdmin={isAdmin} />
          ) : (
            <GuestNav />
          )}
        </div>
      </div>
    </header>
  );
}
