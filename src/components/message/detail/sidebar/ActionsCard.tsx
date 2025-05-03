
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
  conditionType,
  supportsReminders = false
}: ActionsCardProps) {
  const navigate = useNavigate();

  // Common hover effect classes
  const hoverEffect = "transition-all hover:-translate-y-0.5 hover:shadow-md";
  const iconHoverEffect = "transition-transform group-hover:scale-110";

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
            className={`w-full group ${hoverEffect}`}
            onClick={isArmed ? handleDisarmMessage : handleArmMessage}
            disabled={isActionLoading}
          >
            {isArmed ? (
              <>
                <ShieldOff className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
                Disarm Message
              </>
            ) : (
              <>
                <Shield className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
                Arm Message
              </>
            )}
          </Button>
        )}

        {/* Reminders Button - SECOND - Only show for supported condition types */}
        {conditionId && supportsReminders && onViewReminderHistory && (
          <Button
            variant="outline"
            className={`w-full group ${hoverEffect}`}
            onClick={onViewReminderHistory}
            disabled={isActionLoading}
          >
            <Clock className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
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
                    className={`w-full group ${hoverEffect}`}
                    onClick={onSendTestMessage}
                    disabled={isArmed || isActionLoading}
                  >
                    <Mail className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
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
                  className={`w-full group ${hoverEffect}`}
                  onClick={() => navigate(`/message/${messageId}/edit`)}
                  disabled={isArmed || isActionLoading}
                >
                  <Pencil className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
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
                      className={`flex-1 group ${hoverEffect}`}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className={`flex-1 group ${hoverEffect}`}
                      onClick={handleDelete}
                      disabled={isActionLoading}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className={`w-full group border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground ${hoverEffect}`}
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isArmed || isActionLoading}
                  >
                    <Trash2 className={`h-4 w-4 mr-2 ${iconHoverEffect}`} />
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
