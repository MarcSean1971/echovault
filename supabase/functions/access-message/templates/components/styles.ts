
/**
 * CSS styles for message display
 */
export function getMessageStyles(): string {
  return `
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
