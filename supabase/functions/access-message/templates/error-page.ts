
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
            background-color: #f9fafb;
          }
          .error-container {
            border: 1px solid #f44336;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #d32f2f;
            margin-top: 0;
          }
          .back-button {
            display: inline-block;
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 10px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 20px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }
          .back-button:hover {
            background-color: #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transform: translateY(-1px);
          }
          /* Consistent hover effect applied throughout */
          button:hover, a:hover {
            opacity: 0.9;
            transition: opacity 0.2s ease;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="javascript:history.back()" class="back-button">Go Back</a>
        </div>
      </body>
    </html>
  `;
}
