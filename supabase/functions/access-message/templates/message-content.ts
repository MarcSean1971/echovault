
/**
 * Template for displaying message content
 */
import { renderLocation } from "./components/location-renderer.ts";
import { renderAttachments } from "./components/attachments-renderer.ts";
import { getClientScripts } from "./components/client-scripts.ts";
import { getMessageStyles } from "./components/styles.ts";

export function renderMessageContent(message: any, deliveryId: string | null, recipientEmail: string | null): string {
  return `
    <div class="message-container">
      <div class="message-header">
        <h2>${message.title || 'No Title'}</h2>
        <div>Sent: ${new Date(message.created_at).toLocaleString()}</div>
      </div>
      
      <div class="message-content">
        ${message.content || 'No message content'}
      </div>
      
      ${renderLocation(message)}
      ${renderAttachments(message, deliveryId, recipientEmail)}
    </div>
    
    ${getClientScripts()}
    ${getMessageStyles()}
  `;
}
