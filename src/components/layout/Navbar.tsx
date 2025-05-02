
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ShieldAlert } from "lucide-react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";

interface NavbarProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export default function Navbar({ isLoggedIn = false, isAdmin = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials, user } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [showAdminLink, setShowAdminLink] = useState(false);

  // Determine user initials and image when user data is loaded
  useEffect(() => {
    if (profile) {
      setInitials(getInitials());
      setUserImage(profile.avatar_url);
    } else {
      setInitials("U");
      setUserImage(null);
    }

    // Check if user is admin based on email
    if (user?.email) {
      import('@/utils/adminUtils').then(({ isAdminEmail }) => {
        setShowAdminLink(isAdminEmail(user.email));
      });
    }
  }, [profile, getInitials, user]);

  // Use the auth check from context if available, otherwise fall back to prop
  const authenticated = isLoaded ? isSignedIn : isLoggedIn;
  const isUserAdmin = isAdmin || showAdminLink;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <Logo />
        
        {/* Desktop navigation */}
        {authenticated && (
          <div className="hidden md:block flex-1">
            <DesktopNav userImage={userImage} initials={initials} isAdmin={isUserAdmin} />
          </div>
        )}
        
        {/* Centered "Check In" button for larger screens only */}
        {authenticated && !isUserAdmin && (
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
        
        {/* Admin Button */}
        {authenticated && isUserAdmin && (
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-20">
            <Button
              asChild
              variant="destructive"
              className="px-6 py-2 hover:shadow-xl transform hover:-translate-y-1"
              size="lg"
            >
              <Link to="/admin" className="flex items-center gap-2 font-medium">
                <ShieldAlert className="h-5 w-5" />
                Admin Dashboard
              </Link>
            </Button>
          </div>
        )}

        {/* Mobile navigation */}
        <div className="md:hidden flex flex-1 justify-end">
          {authenticated ? (
            <MobileNav userImage={userImage} initials={initials} isAdmin={isUserAdmin} />
          ) : (
            <GuestNav />
          )}
        </div>
      </div>
    </header>
  );
}
