
import { calculateSecurityDates } from "../security-service.ts";

/**
 * Check security conditions for message access
 */
export function checkSecurityConditions(condition: any, deliveryRecord: any) {
  // Fix: Explicitly check for pin_code existence instead of assuming it exists
  const hasPinCode = condition.pin_code && condition.pin_code.trim() !== '';
  
  // Log the PIN code status for debugging
  console.log(`Message security check: hasPinCode=${hasPinCode}, actual pin_code=${condition.pin_code || 'null'}`);
  
  const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
  const hasExpiry = (condition.expiry_hours || 0) > 0;
  
  // Calculate dates for delay and expiry
  const deliveryDate = deliveryRecord?.delivered_at 
    ? new Date(deliveryRecord.delivered_at) 
    : new Date(); // Fallback to current time if delivery date not available
  
  const { unlockDate, expiryDate, isExpired } = calculateSecurityDates(
    deliveryDate, 
    hasDelayedAccess, 
    hasExpiry, 
    condition.unlock_delay_hours || 0, 
    condition.expiry_hours || 0
  );
  
  // Check if the PIN has been verified for this session
  const pinVerified = deliveryRecord?.viewed_count && deliveryRecord.viewed_count > 0;
  
  return { 
    hasPinCode, 
    hasDelayedAccess, 
    hasExpiry, 
    unlockDate, 
    expiryDate, 
    isExpired, 
    pinVerified 
  };
}
