
/**
 * Template for error pages
 */
export function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
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
            border: 1px solid #f44336;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            background-color: #ffebee;
          }
          h1 {
            color: #d32f2f;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `;
}
