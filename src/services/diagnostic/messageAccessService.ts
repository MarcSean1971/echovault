// Fix the type conversion in messageAccessService
import { Message, MessageType } from "@/types/message";

export const getPublicMessage = async (messageId: string, pinCode?: string) => {
  // Mock implementation - replace with actual data fetching
  const message = {
    id: messageId,
    title: "Emergency Message",
    content: "This is a test emergency message.",
    message_type: "text",
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

  const attachments = [
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
    message: message as Message,
    isLoading: false,
    verifyPin: (pin: string) => pin === "1234",
    handleUnlockExpired: () => console.log("Unlock expired"),
    fetchMessage: async () => message as Message
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

// Add type assertion to ensure message_type is of MessageType
const messageWithProperType = {
  ...message,
  message_type: message.message_type as MessageType,
  attachments: attachments.map(attachment => ({
    id: attachment.id,
    message_id: attachment.message_id,
    file_name: attachment.file_name,
    file_size: attachment.file_size,
    file_type: attachment.file_type,
    url: attachment.url,
    created_at: attachment.created_at || new Date().toISOString(),
    path: attachment.path,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type
  }))
};
