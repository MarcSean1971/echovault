
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
 * Helper function to render attachments
 */
function renderAttachments(message: any): string {
  if (!message.attachments || message.attachments.length === 0) {
    return '';
  }
  
  return `
    <div class="message-attachments">
      <h3>Attachments</h3>
      ${message.attachments.map((attachment: any) => `
        <a href="#" class="attachment-item" onclick="alert('Attachments are currently not available for direct download from this secure view. Please contact the sender if you need access to this file.')">
          ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
        </a>
      `).join('')}
    </div>
  `;
}
