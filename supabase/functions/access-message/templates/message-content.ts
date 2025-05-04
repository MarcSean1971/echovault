
/**
 * Template for displaying message content
 */
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
      ${renderAttachments(message)}
    </div>
    
    <script>
      // Get the current absolute URL base
      const currentUrl = window.location.href;
      const baseUrl = currentUrl.split('/access-message')[0];
      
      console.log('Using base URL for API calls:', baseUrl);
      
      // Record that this message was viewed
      fetch(baseUrl + '/access-message/record-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId: '${message.id}', 
          deliveryId: '${deliveryId || ''}',
          recipientEmail: '${recipientEmail || ''}'
        })
      }).catch(error => console.error('Error recording view:', error));
    </script>
  `;
}

/**
 * Helper function to render location if available
 */
function renderLocation(message: any): string {
  if (!message.share_location || message.location_latitude == null || message.location_longitude == null) {
    return '';
  }
  
  return `
    <div class="message-location">
      <h3>Location</h3>
      <div class="location-details">
        <p>${message.location_name || 'Location attached'}</p>
        <div class="map-container">
          <img 
            src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${message.location_longitude},${message.location_latitude})/${message.location_longitude},${message.location_latitude},13,0/500x300" 
            alt="Message location map"
            style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #ddd;"
          />
        </div>
      </div>
    </div>
  `;
}

/**
 * Helper function to render attachments
 */
function renderAttachments(message: any): string {
  if (!message.attachments || message.attachments.length === 0) {
    return '';
  }
  
  return `
    <div class="message-attachments">
      <h3>Attachments</h3>
      <div class="attachment-list">
        ${message.attachments.map((attachment: any) => `
          <div class="attachment-item">
            ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
          </div>
        `).join('')}
      </div>
      <p class="attachment-note">
        For security reasons, attachments cannot be directly downloaded from this secure view.
      </p>
    </div>
  `;
}
