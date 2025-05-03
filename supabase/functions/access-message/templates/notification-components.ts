
/**
 * Template components for notifications and alerts
 */

/**
 * Display an expired message notification
 */
export function renderExpiredMessage(): string {
  return `
    <div class="expired-message">
      <strong>This message has expired and is no longer available.</strong>
    </div>
  `;
}

/**
 * Display a delayed access message notification
 */
export function renderDelayedMessage(formattedUnlockDate: string): string {
  return `
    <div class="info-message">
      <strong>This message is not yet available.</strong><br>
      The sender has set this message to become available on ${formattedUnlockDate}.
      Please check back after this time.
    </div>
  `;
}

/**
 * Display an expiry date notification
 */
export function renderExpiryNotification(formattedExpiryDate: string): string {
  return `
    <div class="info-message">
      <strong>This message will expire on ${formattedExpiryDate}.</strong><br>
      Please make sure to save any important information before this date.
    </div>
  `;
}

/**
 * Render an error message
 */
export function renderErrorMessage(title: string, message: string): string {
  return `
    <div class="error-message">
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
}
