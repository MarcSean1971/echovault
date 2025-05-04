
import { createContext, useState, useContext, ReactNode } from "react";

interface Message {
  id: string;
  title: string;
}

interface MessageListContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

const MessageListContext = createContext<MessageListContextType | undefined>(undefined);

export function MessageListProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <MessageListContext.Provider value={{ messages, setMessages }}>
      {children}
    </MessageListContext.Provider>
  );
}

export const useMessageList = () => {
  const context = useContext(MessageListContext);
  if (context === undefined) {
    throw new Error("useMessageList must be used within a MessageListProvider");
  }
  return context;
};
