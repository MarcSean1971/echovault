
import { createContext, useContext, useState } from "react";

type MessageType = "text";

interface MessageFormContextType {
  messageType: MessageType;
  content: string;
  textContent: string;
  setMessageType: (messageType: MessageType) => void;
  setContent: (content: string) => void;
  setTextContent: (content: string) => void;
}

const MessageFormContext = createContext<MessageFormContextType | undefined>(undefined);

export const MessageFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [content, setContent] = useState("");
  const [textContent, setTextContent] = useState("");

  return (
    <MessageFormContext.Provider
      value={{
        messageType,
        content,
        textContent,
        setMessageType,
        setContent,
        setTextContent,
      }}
    >
      {children}
    </MessageFormContext.Provider>
  );
};

export const useMessageForm = () => {
  const context = useContext(MessageFormContext);
  if (context === undefined) {
    throw new Error("useMessageForm must be used within a MessageFormProvider");
  }
  return context;
};
