import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCard } from "@/components/message/MessageCard";
import { MessageFilters } from "@/components/message/MessageFilters";
import { CreateMessageButton } from "@/components/message/CreateMessageButton";
import { useMessages } from "@/hooks/useMessages";
import { useReminderBatch } from "@/hooks/useReminderBatch";
import { MessageSkeleton } from "@/components/message/MessageSkeleton";
import { EmergencyRecoveryButton } from "@/components/debug/EmergencyRecoveryButton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export default function Messages() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "armed" | "disarmed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "no_check_in" | "scheduled" | "panic_trigger">("all");
  
  const { messages, isLoading, deleteMessage, refreshMessages } = useMessages();
  
  const { reminderInfo } = useReminderBatch(messages || []);
  
  useEffect(() => {
    const handleConditionsUpdated = () => {
      refreshMessages();
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => window.removeEventListener('conditions-updated', handleConditionsUpdated);
  }, [refreshMessages]);

  const filteredMessages = messages?.filter((message) => {
    if (statusFilter !== "all") {
      const isArmed = message.condition?.active === true;
      if ((statusFilter === "armed" && !isArmed) || (statusFilter === "disarmed" && isArmed)) {
        return false;
      }
    }

    if (typeFilter !== "all") {
      if (message.condition?.condition_type !== typeFilter) {
        return false;
      }
    }
    return true; // placeholder
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Messages</h1>
          <CreateMessageButton />
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <MessageSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <div className="flex items-center gap-2">
          <EmergencyRecoveryButton />
          <CreateMessageButton />
        </div>
      </div>
      
      <MessageFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No messages found.</p>
          <CreateMessageButton />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onDelete={deleteMessage}
              reminderInfo={reminderInfo[message.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
