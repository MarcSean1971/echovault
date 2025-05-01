
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ConditionTypeSelectorProps {
  conditionType: 'no_check_in' | 'regular_check_in';
  setConditionType: (value: 'no_check_in' | 'regular_check_in') => void;
}

export function ConditionTypeSelector({
  conditionType,
  setConditionType
}: ConditionTypeSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Condition Type</Label>
      <RadioGroup 
        value={conditionType}
        onValueChange={(value) => setConditionType(value as 'no_check_in' | 'regular_check_in')}
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
      </RadioGroup>
    </div>
  );
}
