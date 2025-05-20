
import { useCallback, useEffect } from "react";
import { checkLocationPermission } from "./locationUtils";

/**
 * Hook for managing location permissions
 */
export function useLocationManager(setLocationPermission: (permission: string) => void) {
  // Check if location permissions are available
  useEffect(() => {
    const initializeLocationPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
    };
    
    initializeLocationPermission();
  }, [setLocationPermission]);
  
  // Refresh location permission on user interaction 
  const refreshLocationPermission = useCallback(async () => {
    const permission = await checkLocationPermission();
    setLocationPermission(permission);
    return permission;
  }, [setLocationPermission]);

  return {
    refreshLocationPermission
  };
}
