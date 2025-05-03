
/**
 * Main template module for message display
 */
import { renderBaseHtml } from "./templates/base-template.ts";
import { renderPinForm } from "./templates/pin-form.ts";
import { renderMessageContent } from "./templates/message-content.ts";
import { 
  renderExpiredMessage,
  renderDelayedMessage,
  renderExpiryNotification
} from "./templates/notification-components.ts";
export { renderErrorPage } from "./templates/error-page.ts";

/**
 * HTML template for displaying messages
 */
export const renderMessagePage = (
  message: any, 
  isPinProtected: boolean = false,
  isDelayed: boolean = false,
  unlockDate: string | null = null,
  expiryDate: string | null = null,
  isExpired: boolean = false,
  deliveryId: string | null = null,
  recipientEmail: string | null = null
) => {
  // Format dates for display
  const formattedUnlockDate = unlockDate ? new Date(unlockDate).toLocaleString() : null;
  const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleString() : null;
  
  let content = '';
  
  // Add notification banners based on message state
  if (isExpired) {
    content += renderExpiredMessage();
  }
  
  if (isDelayed && unlockDate && new Date(unlockDate) > new Date() && formattedUnlockDate) {
    content += renderDelayedMessage(formattedUnlockDate);
  }
  
  if (expiryDate && !isExpired && formattedExpiryDate) {
    content += renderExpiryNotification(formattedExpiryDate);
  }

  // Add the main content based on protection status
  if (isPinProtected) {
    content += renderPinForm(message.id, deliveryId, recipientEmail);
  } else {
    content += renderMessageContent(message, deliveryId, recipientEmail);
  }
  
  // Render the complete HTML page
  return renderBaseHtml(message.title || 'Secure Message', content);
};
