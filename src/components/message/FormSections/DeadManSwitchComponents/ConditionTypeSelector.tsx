
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TriggerType } from "@/types/message";
import { AlertCircle, Calendar, Bell } from "lucide-react";
import { RadioOptionWithTooltip } from "./RadioOptionWithTooltip";

interface ConditionTypeSelectorProps {
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
}

export function ConditionTypeSelector({
  conditionType,
  setConditionType
}: ConditionTypeSelectorProps) {
  return (
    <div>
      <Label className="mb-3 block font-medium">How should this message be delivered?</Label>
      <RadioGroup 
        value={conditionType}
        onValueChange={(value) => setConditionType(value as TriggerType)}
        className="space-y-4"
      >
        <RadioOptionWithTooltip 
          value="no_check_in"
          id="no-check-in"
          label="Send if I don't check in"
          description="Classic dead man's switch - requires regular check-ins to prevent delivery"
          icon={AlertCircle}
          tooltipText="Message will be sent if you don't check in before the deadline."
        />
        
        <RadioOptionWithTooltip 
          value="scheduled_date"
          id="scheduled-date"
          label="Send on a specific date"
          description="Schedule for future delivery on a specific date and time"
          icon={Calendar}
          tooltipText="Message will be delivered on the date & time you specify."
        />
        
        <RadioOptionWithTooltip 
          value="panic_trigger"
          id="panic-trigger"
          label="Manual panic button"
          description="For emergency situations - sends message immediately when triggered"
          icon={Bell}
          tooltipText="Creates a button you can press in an emergency to instantly deliver this message."
        />
      </RadioGroup>
    </div>
  );
}
