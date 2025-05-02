
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldOff,
  Trash2,
  Bell,
  Pencil,
  Clock,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionsCardProps {
  messageId: string;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  handleArmMessage: () => Promise<void>;
  handleDisarmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (value: boolean) => void;
  handleDelete: () => Promise<void>;
  onSendTestMessage?: () => void;
  onViewReminderHistory?: () => void;
  conditionType?: string;
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
  conditionType
}: ActionsCardProps) {
  const navigate = useNavigate();
  
  // Check if the condition type supports reminders (not panic_trigger)
  const supportsReminders = conditionType && conditionType !== 'panic_trigger';

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Actions</h3>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Arm/Disarm Button - FIRST */}
        {conditionId && (
          <Button
            variant={isArmed ? "destructive" : "default"}
            className="w-full"
            onClick={isArmed ? handleDisarmMessage : handleArmMessage}
            disabled={isActionLoading}
          >
            {isArmed ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Disarm Message
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Arm Message
              </>
            )}
          </Button>
        )}

        {/* Reminders Button - SECOND - Only show for non-panic trigger types */}
        {conditionId && supportsReminders && onViewReminderHistory && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewReminderHistory}
            disabled={isActionLoading}
          >
            <Clock className="h-4 w-4 mr-2" />
            View Reminder History
          </Button>
        )}

        {/* Send Test Message Button - THIRD */}
        {conditionId && onSendTestMessage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onSendTestMessage}
                    disabled={isArmed || isActionLoading}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Message
                  </Button>
                </div>
              </TooltipTrigger>
              {isArmed && (
                <TooltipContent>
                  <p>Disarm the message first to send a test</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit Message Button - FOURTH */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/message/${messageId}/edit`)}
                  disabled={isArmed || isActionLoading}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Message
                </Button>
              </div>
            </TooltipTrigger>
            {isArmed && (
              <TooltipContent>
                <p>Disarm the message first to edit it</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Delete Button / Confirm - FIFTH */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                {showDeleteConfirm ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={isActionLoading}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isArmed || isActionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Message
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            {isArmed && !showDeleteConfirm && (
              <TooltipContent>
                <p>Disarm the message first to delete it</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
