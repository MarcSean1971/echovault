import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { Logo } from "./navbar/Logo";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileNav } from "./navbar/MobileNav";
import { GuestNav } from "./navbar/GuestNav";
import { toast } from "@/components/ui/use-toast";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, profile, getInitials, userId } = useAuth();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [isChecking, setIsChecking] = useState(false);
  const { handleCheckIn, conditions } = useTriggerDashboard();
  
  // Panic button states
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [triggerInProgress, setTriggerInProgress] = useState(false);

  // Find panic message from conditions
  const panicMessage = conditions.find(c => 
    c.condition_type === 'panic_trigger' && c.active === true
  ) || null;

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

  // Handle panic trigger
  const handlePanicTrigger = async () => {
    if (!userId || !panicMessage) {
      toast({
        title: "Error",
        description: "No panic message is configured",
        variant: "destructive"
      });
      return;
    }

    if (isConfirming) {
      setTriggerInProgress(true);
      setPanicMode(true);
      
      try {
        // Trigger the panic message
        const result = await triggerPanicMessage(userId, panicMessage.message_id);
        
        if (result.success) {
          toast({
            title: "EMERGENCY ALERT TRIGGERED",
            description: "Your emergency messages are being sent immediately.",
            variant: "destructive"
          });
          
          // Start countdown for visual feedback
          let secondsLeft = 3;
          setCountDown(secondsLeft);
          
          const timer = setInterval(() => {
            secondsLeft -= 1;
            setCountDown(secondsLeft);
            
            if (secondsLeft <= 0) {
              clearInterval(timer);
              setPanicMode(false);
              setIsConfirming(false);
              setTriggerInProgress(false);
              
              // If the message is still armed (keepArmed=true), refresh to show it's still active
              // Otherwise navigate to messages
              if (result.keepArmed) {
                toast({
                  title: "Emergency message still armed",
                  description: "Your emergency message remains active and can be triggered again if needed."
                });
                window.location.reload();
              } else {
                navigate('/messages');
              }
            }
          }, 1000);
        }
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to trigger panic message. Please try again.",
          variant: "destructive"
        });
        setPanicMode(false);
        setIsConfirming(false);
        setTriggerInProgress(false);
      }
    } else {
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        if (isConfirming) {
          setIsConfirming(false);
        }
      }, 3000);
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
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-20 space-x-4">
            {/* Check In Now button */}
            <Button 
              onClick={onCheckIn}
              disabled={isChecking || panicMode}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 pulse-subtle px-6 py-2 animate-pulse-light"
              size="lg"
            >
              <span className="flex items-center gap-2 font-medium">
                <Check className="h-5 w-5" />
                {isChecking ? "Checking In..." : "Check In Now"}
              </span>
            </Button>
            
            {/* Emergency Panic Button */}
            {panicMessage && (
              <Button 
                onClick={handlePanicTrigger}
                disabled={isChecking || panicMode || triggerInProgress}
                variant={isConfirming ? "destructive" : "outline"}
                className={`transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 px-6 py-2 ${
                  isConfirming ? 
                    "bg-gradient-to-r from-red-600 to-red-500 text-white animate-pulse" : 
                    "border-red-500 text-red-500 hover:bg-red-50"
                }`}
                size="lg"
              >
                <span className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-5 w-5" />
                  {panicMode 
                    ? countDown > 0 
                      ? `SENDING... (${countDown})` 
                      : "SENDING..." 
                    : isConfirming 
                      ? "CONFIRM EMERGENCY" 
                      : "Emergency"
                  }
                </span>
              </Button>
            )}
          </div>
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
