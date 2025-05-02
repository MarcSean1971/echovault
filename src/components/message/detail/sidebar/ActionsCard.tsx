
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  AlertCircle,
  Edit,
  ArrowRightCircle,
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { ReminderHistoryDialog } from "../ReminderHistoryDialog";

interface ActionsCardProps {
  messageId: string;
  isArmed: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
}

export function ActionsCard({
  messageId,
  isArmed,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete
}: ActionsCardProps) {
  const [showReminderHistory, setShowReminderHistory] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-lg font-medium mb-2">Actions</h3>
          
          <Link to={`/message/edit/${messageId}`} className="w-full">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 justify-start"
              disabled={isArmed}
            >
              <Edit className="h-4 w-4" /> 
              Edit Message
            </Button>
          </Link>
          
          <Link to={`/messages`} className="w-full">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 justify-start"
            >
              <ArrowRightCircle className="h-4 w-4" /> 
              Back to Messages
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 justify-start"
            onClick={() => setShowReminderHistory(true)}
          >
            <Bell className="h-4 w-4" /> 
            View Reminder History
          </Button>
          
          {showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this message?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isArmed}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" /> 
              Delete Message
            </Button>
          )}
        </CardContent>
      </Card>
      
      <ReminderHistoryDialog
        open={showReminderHistory}
        onOpenChange={setShowReminderHistory}
        messageId={messageId}
      />
    </>
  );
}
