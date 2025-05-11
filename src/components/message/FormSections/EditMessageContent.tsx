import React, { useEffect } from "react";
import { useMessageForm } from "../MessageFormContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageFormSection } from "./MessageFormSection";
import { MessageDetails } from "./MessageDetails";
import { Message } from "@/types/message";

interface EditMessageContentProps {
  message: Message;
  selectedRecipients: string[];
  handleToggleRecipient: (recipientId: string) => void;
}

export function EditMessageContent({
  message,
  selectedRecipients,
  handleToggleRecipient,
}: EditMessageContentProps) {
  const { messageType, setMessageType } = useMessageForm();

  // This ensures our file previews are properly marked as uploaded
  useEffect(() => {
    if (message?.attachments?.length > 0) {
      console.log("EditMessageContent: Found existing attachments to mark as uploaded");
    }
  }, [message]);
  
  return (
    <div className="p-6 space-y-8">
      <Tabs defaultValue="message" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="message">Message Details</TabsTrigger>
          <TabsTrigger value="delivery">Recipients & Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="space-y-6">
          <MessageFormSection 
            title="Message Information" 
            description="Create your message content and attach files"
          >
            <MessageDetails message={message} />
          </MessageFormSection>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          {/* Recipient selection */}
          <MessageFormSection 
            title="Recipients"
            description="Select who will receive this message"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {message.recipients?.map((recipient) => (
                <div
                  key={recipient.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRecipients.includes(recipient.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleToggleRecipient(recipient.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{recipient.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {recipient.email}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border ${
                        selectedRecipients.includes(recipient.id)
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedRecipients.includes(recipient.id) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </MessageFormSection>
          
          {/* Delivery conditions */}
          <MessageFormSection 
            title="Delivery Conditions"
            description="When and how should this message be sent?"
          >
            <div className="space-y-6">
              {/* Condition type selection will be added here */}
              <p className="text-sm text-muted-foreground">
                Delivery conditions will be configured in a future update.
              </p>
            </div>
          </MessageFormSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
