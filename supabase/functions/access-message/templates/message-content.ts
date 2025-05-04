
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
      ${renderAttachments(message, deliveryId, recipientEmail)}
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
      
      // Function to download attachments
      function downloadAttachment(path, name) {
        const downloadSpinner = document.getElementById('download-spinner-' + path.replace(/[^a-zA-Z0-9]/g, '-'));
        if (downloadSpinner) downloadSpinner.style.display = 'inline-block';
        
        fetch(baseUrl + '/access-message/download-attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: '${message.id}',
            deliveryId: '${deliveryId || ''}',
            recipientEmail: '${recipientEmail || ''}',
            attachmentPath: path,
            attachmentName: name
          })
        })
        .then(response => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          
          if (downloadSpinner) downloadSpinner.style.display = 'none';
          showMessage('Download complete', 'success');
        })
        .catch(error => {
          console.error('Download error:', error);
          if (downloadSpinner) downloadSpinner.style.display = 'none';
          showMessage('Download failed, please try again', 'error');
        });
      }
      
      // Function to show status messages
      function showMessage(message, type) {
        const messageBox = document.createElement('div');
        messageBox.className = 'message-box ' + type;
        messageBox.innerHTML = message;
        document.body.appendChild(messageBox);
        
        setTimeout(() => {
          messageBox.classList.add('show');
          setTimeout(() => {
            messageBox.classList.remove('show');
            setTimeout(() => {
              document.body.removeChild(messageBox);
            }, 300);
          }, 3000);
        }, 10);
      }
    </script>
    
    <style>
      .message-box {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
      }
      
      .message-box.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      
      .message-box.success {
        background-color: #4caf50;
      }
      
      .message-box.error {
        background-color: #f44336;
      }
      
      .download-spinner {
        display: none;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-left-color: #09f;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {transform: rotate(360deg);}
      }
    </style>
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
function renderAttachments(message: any, deliveryId: string | null, recipientEmail: string | null): string {
  if (!message.attachments || message.attachments.length === 0) {
    return '';
  }
  
  // Only authorized recipients with delivery ID can download
  const canDownload = !!deliveryId && !!recipientEmail;
  
  return `
    <div class="message-attachments">
      <h3>Attachments</h3>
      <div class="attachment-list">
        ${message.attachments.map((attachment: any, index: number) => `
          <div class="attachment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 8px 0; background: #f5f5f5; border-radius: 4px;">
            <div>
              ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
            </div>
            ${canDownload ? `
              <div>
                <button 
                  onclick="downloadAttachment('${attachment.path}', '${attachment.name}')"
                  style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;"
                >
                  Download
                  <span id="download-spinner-${attachment.path.replace(/[^a-zA-Z0-9]/g, '-')}" class="download-spinner"></span>
                </button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ${!canDownload ? `
        <p class="attachment-note">
          For security reasons, attachments require proper authentication to download.
        </p>
      ` : ''}
    </div>
  `;
}
