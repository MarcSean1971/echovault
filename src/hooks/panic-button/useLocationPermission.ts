
import { useState, useEffect } from "react";
import { 
  checkLocationPermission as checkPermission, 
  requestLocationPermission as requestPermission 
} from "./locationUtils";

/**
 * Hook for managing location permission
 */
export function useLocationPermission() {
  const [locationPermission, setLocationPermission] = useState<string>("unknown");
  
  // Check location permissions on mount
  useEffect(() => {
    const initPermission = async () => {
      const permission = await checkPermission();
      setLocationPermission(permission);
    };
    
    initPermission();
  }, []);

  // Function to check permission and update state
  const checkLocationPermission = async () => {
    const permission = await checkPermission();
    setLocationPermission(permission);
    return permission;
  };

  // Function to request permission with callbacks
  const requestLocationPermission = (
    onGranted: () => void,
    onDenied: () => void
  ) => {
    requestPermission(
      () => {
        setLocationPermission("granted");
        onGranted();
      },
      () => {
        setLocationPermission("denied");
        onDenied();
      }
    );
  };

  return {
    locationPermission,
    checkLocationPermission,
    requestLocationPermission
  };
}
