
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionsHeader } from "./actions/ActionsHeader";
import { ArmButton } from "./actions/ArmButton";
import { TestMessageButton } from "./actions/TestMessageButton";
import { EditMessageButton } from "./actions/EditMessageButton";
import { DeleteMessageButton } from "./actions/DeleteMessageButton";
import { ReminderHistoryButton } from "./actions/ReminderHistoryButton";

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
  conditionType?: string;
  onViewReminderHistory?: () => void;
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
  conditionType,
  onViewReminderHistory
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

        {/* Send Test Message Button - SECOND */}
        {conditionId && onSendTestMessage && (
          <TestMessageButton
            onSendTestMessage={onSendTestMessage}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
          />
        )}

        {/* View Reminder History Button - Add back */}
        {conditionId && onViewReminderHistory && conditionType === 'no_check_in' && (
          <ReminderHistoryButton
            onViewReminderHistory={onViewReminderHistory}
            isActionLoading={isActionLoading}
          />
        )}

        {/* Edit Message Button - THIRD */}
        <EditMessageButton
          messageId={messageId}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
        />

        {/* Delete Button / Confirm - FOURTH */}
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
