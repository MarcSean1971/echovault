
/**
 * Base HTML template for all message pages
 */
export function renderBaseHtml(
  title: string,
  content: string,
  styles: string = getDefaultStyles()
) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${title}</title>
    <style>
      ${styles}
    </style>
  </head>
  <body>
    <h1>Secure Message</h1>
    ${content}
  </body>
  </html>
  `;
}

/**
 * Default styles for all pages
 */
function getDefaultStyles(): string {
  return `
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
      transition: background 0.2s ease;
    }
    .attachment-item:hover {
      background: #e0e0e0;
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
      transition: background 0.2s ease;
    }
    .submit-button:hover {
      background: #0060df;
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
  `;
}
