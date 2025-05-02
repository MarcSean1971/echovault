
import React from "react";
import { Message } from "@/types/message";

interface MessageTabsProps {
  message: Message;
  isArmed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  condition: any | null;
  renderConditionType: () => string;
  formatDate: (dateString: string) => string;
}

// This component is being phased out in favor of showing content and delivery settings directly
// It's kept as a stub to avoid breaking any imports
export function MessageTabs({
  message,
  isArmed,
  activeTab,
  setActiveTab,
  condition,
  renderConditionType,
  formatDate
}: MessageTabsProps) {
  return null;
}
