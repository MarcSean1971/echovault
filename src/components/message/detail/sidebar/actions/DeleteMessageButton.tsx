
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "./ActionButton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DeleteMessageButtonProps {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  isArmed: boolean;
  isActionLoading: boolean;
}

export function DeleteMessageButton({
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  isArmed,
  isActionLoading
}: DeleteMessageButtonProps) {
  const iconHoverEffect = "transition-transform group-hover:scale-110";
  
  if (showDeleteConfirm) {
    return (
      <div className="flex space-x-2">
        <Button
          variant="default"
          size="sm"
          className={`flex-1 group ${HOVER_TRANSITION}`}
          onClick={() => setShowDeleteConfirm(false)}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className={`flex-1 group ${HOVER_TRANSITION}`}
          onClick={handleDelete}
          disabled={isActionLoading}
        >
          Delete
        </Button>
      </div>
    );
  }
  
  return (
    <ActionButton
      icon={Trash2}
      label="Delete Message"
      onClick={() => setShowDeleteConfirm(true)}
      disabled={isArmed || isActionLoading}
      variant="outline" 
      iconClassName="text-destructive"
      tooltipText={isArmed ? "Disarm the message first to delete it" : undefined}
    />
  );
}
