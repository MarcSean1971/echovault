
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TriggerType } from "@/types/message";

interface TimeThresholdSelectorProps {
  conditionType: TriggerType;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
}

export function TimeThresholdSelector({
  conditionType,
  hoursThreshold,
  setHoursThreshold
}: TimeThresholdSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">
        {conditionType === 'no_check_in' 
          ? 'How long without a check-in before sending?' 
          : 'Send every:'}
      </Label>
      
      <RadioGroup 
        value={hoursThreshold.toString()} 
        onValueChange={(value) => setHoursThreshold(Number(value))}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2"
      >
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="24" id="hours-24" />
          <Label htmlFor="hours-24" className="cursor-pointer">1 day (24 hours)</Label>
        </div>
        
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="72" id="hours-72" />
          <Label htmlFor="hours-72" className="cursor-pointer">3 days (72 hours)</Label>
        </div>
        
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="168" id="hours-168" />
          <Label htmlFor="hours-168" className="cursor-pointer">1 week (168 hours)</Label>
        </div>
        
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="336" id="hours-336" />
          <Label htmlFor="hours-336" className="cursor-pointer">2 weeks (336 hours)</Label>
        </div>
        
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="720" id="hours-720" />
          <Label htmlFor="hours-720" className="cursor-pointer">1 month (720 hours)</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
