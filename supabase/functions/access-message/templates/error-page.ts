
/**
 * Render an error page with improved styling and error details
 */
export function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .error-container {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-top: 50px;
            border-top: 5px solid #e53e3e;
          }
          h1 {
            color: #e53e3e;
            font-size: 24px;
            margin-top: 0;
          }
          p {
            font-size: 16px;
          }
          .timestamp {
            color: #666;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>${title}</h1>
          <p>${message}</p>
          <p class="timestamp">Error occurred at: ${new Date().toISOString()}</p>
        </div>
      </body>
    </html>
  `;
}
