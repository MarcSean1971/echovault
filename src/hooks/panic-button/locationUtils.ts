
/**
 * Utilities for handling location permissions and gathering location data for panic messages
 */

/**
 * Check location permissions
 */
export const checkLocationPermission = async (): Promise<string> => {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      // Listen for permission changes
      result.onchange = () => {
        // This will be handled by the component that uses this function
        console.log("Location permission changed:", result.state);
      };
      return result.state;
    } catch (err) {
      console.error("Error checking location permissions:", err);
      return "denied";
    }
  }
  return "unknown";
};

/**
 * Request location permission
 */
export const requestLocationPermission = (
  onGranted: () => void,
  onDenied: () => void
): void => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {
        onGranted();
      },
      (error) => {
        console.error("Location permission denied:", error);
        onDenied();
      }
    );
  } else {
    // Device doesn't support geolocation
    onDenied();
  }
};
