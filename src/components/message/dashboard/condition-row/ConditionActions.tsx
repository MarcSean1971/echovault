
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, ShieldAlert } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ConditionActionsProps {
  status: string;
  messageId?: string;
  isLoading: boolean;
  onDisarm: () => Promise<void>;
  onArm: () => Promise<void>;
}

export function ConditionActions({ 
  status, 
  messageId, 
  isLoading, 
  onDisarm, 
  onArm 
}: ConditionActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => messageId && (window.location.href = `/message/${messageId}`)}
        className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.muted}`}
      >
        Details
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
      
      {status === "armed" ? (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDisarm}
          disabled={isLoading}
          className={`${HOVER_TRANSITION} bg-amber-50 hover:bg-amber-100 text-amber-700`}
        >
          <Shield className="h-3 w-3 mr-1" />
          Disarm
        </Button>
      ) : (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onArm}
          disabled={isLoading}
          className={`${HOVER_TRANSITION} bg-green-50 hover:bg-green-100 text-green-700`}
        >
          <ShieldAlert className="h-3 w-3 mr-1" />
          Arm
        </Button>
      )}
    </div>
  );
}
