
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TriggerType } from "@/types/message";

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
      <Label className="mb-2 block">Trigger Type</Label>
      <RadioGroup 
        value={conditionType}
        onValueChange={(value) => setConditionType(value as TriggerType)}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no_check_in" id="no-check-in" />
          <Label htmlFor="no-check-in">Send if I don't check in</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="regular_check_in" id="regular-check-in" />
          <Label htmlFor="regular-check-in">Send on a regular schedule</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="scheduled_date" id="scheduled-date" />
          <Label htmlFor="scheduled-date">Send on a specific date/time</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="group_confirmation" id="group-confirmation" />
          <Label htmlFor="group-confirmation">Send after group confirmation</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="panic_trigger" id="panic-trigger" />
          <Label htmlFor="panic-trigger">Manual panic trigger</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="inactivity_to_recurring" id="inactivity-to-recurring" />
          <Label htmlFor="inactivity-to-recurring">Inactivity → Then recurring schedule</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="inactivity_to_date" id="inactivity-to-date" />
          <Label htmlFor="inactivity-to-date">Inactivity → Then specific date</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
