
// Re-export all services for easy imports
export * from './messageService';
export * from './conditionService';
export * from './recipientService';
export * from './fileService';
export * from './reminderService';
export * from './notificationService';
export * from './whatsApp';
export * from './mediaService';

// Explicitly export needed functions
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export {
  blobToBase64
};
