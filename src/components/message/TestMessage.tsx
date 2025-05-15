
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface TestMessageProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendTest: () => Promise<void>;
  isLoading: boolean;
  messageTitle: string;
  recipientCount: number;
}

export function TestMessage({
  isOpen,
  onOpenChange,
  onSendTest,
  isLoading,
  messageTitle,
  recipientCount,
}: TestMessageProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send test message</DialogTitle>
          <DialogDescription>
            This will send a test copy of <span className="font-medium">{messageTitle}</span> to {recipientCount} {recipientCount === 1 ? "recipient" : "recipients"}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Test messages will be clearly marked as tests and will not trigger any automated actions.
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className={HOVER_TRANSITION}
          >
            Cancel
          </Button>
          <Button 
            onClick={onSendTest} 
            disabled={isLoading || recipientCount === 0}
            className={HOVER_TRANSITION}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Test"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
