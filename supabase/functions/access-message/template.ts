
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
  const currentDate = new Date().toISOString();
  const formattedUnlockDate = unlockDate ? new Date(unlockDate).toLocaleString() : null;
  const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleString() : null;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${message.title || 'Secure Message'}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .message-container {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
        background-color: #f9f9f9;
      }
      .message-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .message-content {
        white-space: pre-wrap;
      }
      .message-attachments {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #eee;
      }
      .attachment-item {
        display: block;
        margin: 5px 0;
        padding: 8px;
        background: #eee;
        border-radius: 4px;
        text-decoration: none;
        color: #333;
      }
      .attachment-item:hover {
        background: #e0e0e0;
        transition: background 0.2s ease;
      }
      .pin-form {
        margin: 40px auto;
        max-width: 300px;
        text-align: center;
      }
      .pin-input {
        width: 200px;
        padding: 10px;
        font-size: 16px;
        margin-bottom: 10px;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .submit-button {
        background: #0070f3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      .submit-button:hover {
        background: #0060df;
        transition: background 0.2s ease;
      }
      .error-message {
        color: #d32f2f;
        margin: 10px 0;
      }
      .info-message {
        background: #fff8e1;
        border-left: 4px solid #ffc107;
        padding: 10px 15px;
        margin: 20px 0;
      }
      .expired-message {
        background: #ffebee;
        border-left: 4px solid #f44336;
        padding: 10px 15px;
        margin: 20px 0;
      }
      .success-message {
        background: #e8f5e9;
        border-left: 4px solid #4caf50;
        padding: 10px 15px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <h1>Secure Message</h1>
    
    ${isExpired ? `
      <div class="expired-message">
        <strong>This message has expired and is no longer available.</strong>
      </div>
    ` : ''}
    
    ${isDelayed && unlockDate && new Date(unlockDate) > new Date() ? `
      <div class="info-message">
        <strong>This message is not yet available.</strong><br>
        The sender has set this message to become available on ${formattedUnlockDate}.
        Please check back after this time.
      </div>
    ` : ''}
    
    ${expiryDate && !isExpired ? `
      <div class="info-message">
        <strong>This message will expire on ${formattedExpiryDate}.</strong><br>
        Please make sure to save any important information before this date.
      </div>
    ` : ''}

    ${isPinProtected ? `
      <div class="pin-form">
        <h2>PIN Protected Message</h2>
        <p>This message requires a PIN to access. Please enter the PIN provided by the sender.</p>
        <form id="pin-form">
          <input type="hidden" id="message-id" value="${message.id}">
          <input type="hidden" id="delivery-id" value="${deliveryId || ''}">
          <input type="hidden" id="recipient-email" value="${recipientEmail || ''}">
          <input type="text" id="pin-input" class="pin-input" placeholder="Enter PIN" required>
          <div id="pin-error" class="error-message" style="display: none;"></div>
          <button type="submit" class="submit-button">Access Message</button>
        </form>
      </div>
      <script>
        document.getElementById('pin-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          const pin = document.getElementById('pin-input').value;
          const messageId = document.getElementById('message-id').value;
          const deliveryId = document.getElementById('delivery-id').value;
          const recipientEmail = document.getElementById('recipient-email').value;
          
          try {
            // Use absolute URL to avoid path resolution issues
            const currentUrl = window.location.href;
            // Extract the base URL up to and including functions/v1/
            const urlParts = currentUrl.split('/');
            const baseUrlParts = [];
            for (let i = 0; i < urlParts.length; i++) {
              baseUrlParts.push(urlParts[i]);
              if (urlParts[i] === 'v1') {
                break;
              }
            }
            const baseUrl = baseUrlParts.join('/');
            
            console.log('Using base URL for API calls:', baseUrl);
            const response = await fetch(baseUrl + '/access-message/verify-pin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pin, 
                messageId,
                deliveryId,
                recipientEmail
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              window.location.reload();
            } else {
              document.getElementById('pin-error').textContent = data.error || 'Incorrect PIN';
              document.getElementById('pin-error').style.display = 'block';
            }
          } catch (error) {
            console.error('Error verifying PIN:', error);
            document.getElementById('pin-error').textContent = 'An error occurred. Please try again.';
            document.getElementById('pin-error').style.display = 'block';
          }
        });
      </script>
    ` : `
      <div class="message-container">
        <div class="message-header">
          <h2>${message.title || 'No Title'}</h2>
          <div>Sent: ${new Date(message.created_at).toLocaleString()}</div>
        </div>
        
        <div class="message-content">
          ${message.content || 'No message content'}
        </div>
        
        ${message.attachments && message.attachments.length > 0 ? `
          <div class="message-attachments">
            <h3>Attachments</h3>
            ${message.attachments.map((attachment: any) => `
              <a href="#" class="attachment-item" onclick="alert('Attachments are currently not available for direct download from this secure view. Please contact the sender if you need access to this file.')">
                ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <script>
        // Use absolute URL to avoid path resolution issues
        const currentUrl = window.location.href;
        // Extract the base URL up to and including functions/v1/
        const urlParts = currentUrl.split('/');
        const baseUrlParts = [];
        for (let i = 0; i < urlParts.length; i++) {
          baseUrlParts.push(urlParts[i]);
          if (urlParts[i] === 'v1') {
            break;
          }
        }
        const baseUrl = baseUrlParts.join('/');
        
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
    `}
  </body>
  </html>
  `;
};
