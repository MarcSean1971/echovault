
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";
import { HeaderButtons } from "./navbar/HeaderButtons";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded, profile, getInitials, userId } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [isChecking, setIsChecking] = useState(false);
  const { handleCheckIn, conditions } = useTriggerDashboard();

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

  // Handle check-in
  const onCheckIn = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await handleCheckIn();
      toast({
        title: "Check-In Successful",
        description: "Your Dead Man's Switch has been reset."
      });
    } catch (error: any) {
      console.error("Check-in failed:", error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to complete check-in",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <Logo />
        
        {/* Desktop navigation */}
        {authenticated && (
          <div className="hidden md:block flex-1">
            <DesktopNav userImage={userImage} initials={initials} />
          </div>
        )}
        
        {/* Centered buttons for larger screens only */}
        {authenticated && (
          <HeaderButtons 
            conditions={conditions}
            userId={userId}
            isChecking={isChecking}
            onCheckIn={onCheckIn}
          />
        )}
        
        {/* Mobile navigation */}
        <div className="md:hidden flex flex-1 justify-end">
          {authenticated ? (
            <MobileNav userImage={userImage} initials={initials} />
          ) : (
            <GuestNav />
          )}
        </div>
      </div>
    </header>
  );
}
