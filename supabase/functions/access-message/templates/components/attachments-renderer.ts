
/**
 * Helper function to render attachments
 */
export function renderAttachments(message: any, deliveryId: string | null, recipientEmail: string | null): string {
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
