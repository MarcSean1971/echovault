
// Fix the type conversion in messageAccessService
import { Message, MessageType } from "@/types/message";

// Add the missing functions for DiagnosticAccess.tsx
export const checkDeliveryRecord = async (messageId: string, deliveryId: string, addLog: (text: string) => void) => {
  addLog(`Checking delivery record for message ${messageId} with delivery ID ${deliveryId}`);
  // Mock implementation - would connect to database in real app
  return {
    found: true,
    deliveryId,
    messageId,
    recipient: "test@example.com",
    deliveredAt: new Date().toISOString()
  };
};

export const loadMessageDirect = async (messageId: string, addLog: (text: string) => void) => {
  addLog(`Loading message directly with ID: ${messageId}`);
  // Mock implementation - would connect to database in real app
  const mockMessage = {
    id: messageId,
    title: "Emergency Message",
    content: "This is a test emergency message.",
    message_type: "text" as MessageType,
    user_id: "user123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(), // Expires in 1 hour
    sender_name: "John Doe",
    share_location: true,
    location_name: "Central Park",
    latitude: 40.7829,
    longitude: -73.9654,
    attachments: []
  };
  
  return mockMessage as Message;
};

export const loadMessageSecure = async (messageId: string, deliveryId: string, recipientEmail: string, addLog: (text: string) => void) => {
  addLog(`Loading message securely with ID: ${messageId}, delivery: ${deliveryId}, recipient: ${recipientEmail}`);
  // Mock implementation - would verify credentials and access rights in real app
  const mockMessage = {
    id: messageId,
    title: "Secure Emergency Message",
    content: "This is a securely accessed test message.",
    message_type: "text" as MessageType,
    user_id: "user123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    sender_name: "John Doe",
    share_location: true,
    location_name: "Central Park",
    latitude: 40.7829,
    longitude: -73.9654,
    attachments: []
  };
  
  return mockMessage as Message;
};

export const loadMessageBypass = async (messageId: string, addLog: (text: string) => void) => {
  addLog(`BYPASSING SECURITY for message ID: ${messageId} - THIS IS FOR DEBUG USE ONLY!`);
  // Mock implementation - would bypass security checks in real app
  const mockMessage = {
    id: messageId,
    title: "DEBUG MODE: Bypassed Security",
    content: "This message has been loaded with security checks bypassed.",
    message_type: "text" as MessageType,
    user_id: "user123", 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    sender_name: "John Doe",
    share_location: true,
    location_name: "Central Park",
    latitude: 40.7829,
    longitude: -73.9654,
    attachments: []
  };
  
  return mockMessage as Message;
};

export const getPublicMessage = async (messageId: string, pinCode?: string) => {
  // Mock implementation - replace with actual data fetching
  const mockMessage = {
    id: messageId,
    title: "Emergency Message",
    content: "This is a test emergency message.",
    message_type: "text" as MessageType,
    user_id: "user123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(), // Expires in 1 hour
    sender_name: "John Doe",
    share_location: true,
    location_name: "Central Park",
    latitude: 40.7829,
    longitude: -73.9654,
    attachments: []
  };

  const mockAttachments = [
    {
      id: "attachment1",
      message_id: messageId,
      file_name: "document.pdf",
      file_size: 2048,
      file_type: "application/pdf",
      url: "https://example.com/document.pdf",
      created_at: new Date().toISOString(),
      path: "/path/to/document.pdf",
      name: "document.pdf",
      size: 2048,
      type: "application/pdf"
    }
  ];

  // Simulate pin verification and unlock delay
  const isPinRequired = !!pinCode;
  const isUnlockDelayed = false;
  const unlockTime = new Date();
  const isVerified = !isPinRequired || pinCode === "1234";

  return {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message: {
      ...mockMessage,
      attachments: mockAttachments
    } as Message,
    isLoading: false,
    verifyPin: (pin: string) => pin === "1234",
    handleUnlockExpired: () => console.log("Unlock expired"),
    fetchMessage: async () => mockMessage as Message
  };
};

// Mock function to simulate fetching message status
export const getMessageAccessStatus = async (messageId: string) => {
  // Simulate different access statuses based on messageId
  const status = {
    id: messageId,
    message_id: messageId,
    status: "active",
    active: true,
    condition_type: "no_check_in"
  };

  return status;
};

// Mock function to simulate fetching message recipients
export const getMessageRecipients = async (messageId: string) => {
  // Simulate different recipients based on messageId
  const recipients = [
    {
      id: "recipient1",
      message_id: messageId,
      recipient_id: "user456",
      delivery_id: "delivery789",
      sent_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      recipient_email: "test@example.com",
      recipient_name: "Test User",
      status: "delivered"
    }
  ];

  return recipients;
};
