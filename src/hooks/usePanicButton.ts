import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { useNavigate } from "react-router-dom";

/**
 * Hook to handle panic button functionality
 */
export function usePanicButton(userId: string | null, panicMessage: MessageCondition | null) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");

  // Check location permissions
  const checkLocationPermission = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        // Listen for permission changes
        result.onchange = () => {
          setLocationPermission(result.state);
        };
        return result.state;
      } catch (err) {
        console.error("Error checking location permissions:", err);
        setLocationPermission("denied");
        return "denied";
      }
    }
    return locationPermission;
  };

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted");
          handlePanicTrigger();
        },
        (error) => {
          console.error("Location permission denied:", error);
          setLocationPermission("denied");
          toast({
            title: "Location Access Denied",
            description: "Your current location won't be included in the emergency message",
            variant: "destructive"
          });
          // Continue with panic trigger even without location
          handlePanicTrigger();
        }
      );
    } else {
      toast({
        title: "Location Not Available",
        description: "Your device doesn't support location services",
        variant: "destructive"
      });
      // Continue with panic trigger even without location
      handlePanicTrigger();
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
            description: "Your emergency messages with your current location are being sent immediately.",
            variant: "destructive"
          });
          
          // Start countdown for visual feedback
          let secondsLeft = 3;
          setCountDown(secondsLeft);
          
          // Dispatch event with panic message ID so message cards can show countdown
          window.dispatchEvent(new CustomEvent('conditions-updated', { 
            detail: { 
              updatedAt: new Date().toISOString(),
              triggerValue: Date.now(),
              panicTrigger: true,
              panicMessageId: panicMessage.message_id
            }
          }));
          
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
                // Refresh conditions instead of reloading the page
                window.dispatchEvent(new CustomEvent('conditions-updated', { 
                  detail: { 
                    updatedAt: new Date().toISOString(),
                    triggerValue: Date.now()
                  }
                }));
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

  // Handle panic button click with location permission check
  const handlePanicButtonClick = () => {
    if (isConfirming) {
      // If already confirming, check/request location permission
      if (locationPermission === "granted") {
        handlePanicTrigger();
      } else {
        requestLocationPermission();
      }
    } else {
      // Just show confirmation first time
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        if (isConfirming) {
          setIsConfirming(false);
        }
      }, 3000);
    }
  };

  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    locationPermission,
    checkLocationPermission,
    handlePanicButtonClick
  };
}
