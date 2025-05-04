
/**
 * Client-side JavaScript for message functionality
 */
export function getClientScripts(): string {
  return `
    <script>
      // Use a fixed project ID for API calls instead of trying to parse from current URL
      const projectId = 'onwthrpgcnfydxzzmyot';
      const baseUrl = 'https://' + projectId + '.supabase.co';
      
      console.log('Using fixed base URL for API calls:', baseUrl);
      
      // Record that this message was viewed
      fetch(baseUrl + '/functions/v1/access-message/record-view', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({ 
          messageId: '\${message.id}', 
          deliveryId: '\${deliveryId || ''}',
          recipientEmail: '\${recipientEmail || ''}'
        })
      }).catch(error => console.error('Error recording view:', error));
      
      // Function to download attachments
      function downloadAttachment(path, name) {
        const downloadSpinner = document.getElementById('download-spinner-' + path.replace(/[^a-zA-Z0-9]/g, '-'));
        if (downloadSpinner) downloadSpinner.style.display = 'inline-block';
        
        fetch(baseUrl + '/functions/v1/access-message/download-attachment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            messageId: '\${message.id}',
            deliveryId: '\${deliveryId || ''}',
            recipientEmail: '\${recipientEmail || ''}',
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
  `;
}
