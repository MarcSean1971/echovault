
/**
 * Template for PIN protected message form
 */
export function renderPinForm(messageId: string, deliveryId: string | null, recipientEmail: string | null): string {
  return `
    <div class="pin-form">
      <h2>PIN Protected Message</h2>
      <p>This message requires a PIN to access. Please enter the PIN provided by the sender.</p>
      <form id="pin-form">
        <input type="hidden" id="message-id" value="${messageId}">
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
          // Get the current absolute URL base
          const currentUrl = window.location.href;
          const baseUrl = currentUrl.split('/access-message')[0];
          
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
  `;
}
