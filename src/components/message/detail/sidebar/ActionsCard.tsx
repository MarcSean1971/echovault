
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionsHeader } from "./actions/ActionsHeader";
import { ArmButton } from "./actions/ArmButton";
import { ReminderHistoryButton } from "./actions/ReminderHistoryButton";
import { TestMessageButton } from "./actions/TestMessageButton";
import { EditMessageButton } from "./actions/EditMessageButton";
import { DeleteMessageButton } from "./actions/DeleteMessageButton";

interface ActionsCardProps {
  messageId: string;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  handleArmMessage: () => Promise<Date | null>;
  handleDisarmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (value: boolean) => void;
  handleDelete: () => Promise<void>;
  onSendTestMessage?: () => void;
  onViewReminderHistory?: () => void;
  conditionType?: string;
  supportsReminders?: boolean;
}

export function ActionsCard({
  messageId,
  isArmed,
  conditionId,
  isActionLoading,
  handleArmMessage,
  handleDisarmMessage,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  onSendTestMessage,
  onViewReminderHistory,
  supportsReminders = false
}: ActionsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <ActionsHeader />

        {/* Arm/Disarm Button - FIRST */}
        {conditionId && (
          <ArmButton
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            onArmMessage={handleArmMessage}
            onDisarmMessage={handleDisarmMessage}
          />
        )}

        {/* Reminders Button - SECOND - Only show for supported condition types */}
        {conditionId && supportsReminders && onViewReminderHistory && (
          <ReminderHistoryButton
            onViewReminderHistory={onViewReminderHistory}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Send Test Message Button - THIRD */}
        {conditionId && onSendTestMessage && (
          <TestMessageButton
            onSendTestMessage={onSendTestMessage}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Edit Message Button - FOURTH */}
        <EditMessageButton
          messageId={messageId}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
        />

        {/* Delete Button / Confirm - FIFTH */}
        <DeleteMessageButton
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
        />
      </CardContent>
    </Card>
  );
}
