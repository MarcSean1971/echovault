
/**
 * Calculate dates for delayed access and expiry based on settings
 */
export function calculateSecurityDates(deliveryDate: Date, hasDelayedAccess: boolean, hasExpiry: boolean, delayHours: number = 0, expiryHours: number = 0) {
  let unlockDate = null;
  if (hasDelayedAccess) {
    unlockDate = new Date(deliveryDate);
    unlockDate.setHours(unlockDate.getHours() + delayHours);
  }
  
  let expiryDate = null;
  let isExpired = false;
  if (hasExpiry) {
    expiryDate = new Date(deliveryDate);
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    isExpired = expiryDate < new Date();
  }
  
  return {
    unlockDate,
    expiryDate,
    isExpired
  };
}

/**
 * Check if a recipient is authorized to access a message
 */
export function isAuthorizedRecipient(authorizedRecipients: any[], recipientEmail: string) {
  return authorizedRecipients.some((r: any) => 
    r.email && r.email.toLowerCase() === recipientEmail.toLowerCase()
  );
}

/**
 * Find a recipient by email in the recipients list
 */
export function findRecipientByEmail(recipients: any[], email: string) {
  return recipients.find((r: any) => 
    r.email && r.email.toLowerCase() === email.toLowerCase()
  );
}
