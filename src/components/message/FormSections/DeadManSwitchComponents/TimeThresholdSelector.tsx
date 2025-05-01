import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TriggerType } from "@/types/message";
import { useState } from "react";
import { CustomTimeInput } from "./CustomTimeInput";

interface TimeThresholdSelectorProps {
  conditionType: TriggerType;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold?: number;
  setMinutesThreshold?: (value: number) => void;
}

export function TimeThresholdSelector({
  conditionType,
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold = 0,
  setMinutesThreshold = () => {}
}: TimeThresholdSelectorProps) {
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Handle radio selection
  const handleRadioChange = (value: string) => {
    if (value === "custom") {
      setUseCustomTime(true);
      // Keep current values when switching to custom
    } else {
      setUseCustomTime(false);
      setHoursThreshold(Number(value));
      setMinutesThreshold(0);
    }
  };
  
  // Calculate total hours for selection
  const totalHours = hoursThreshold + (minutesThreshold / 60);
  const selectedValue = useCustomTime ? "custom" : hoursThreshold.toString();

  return (
    <div className="space-y-4">
      <Label className="mb-2 block">
        {conditionType === 'no_check_in' 
          ? 'How long without a check-in before sending?' 
          : 'Send every:'}
      </Label>
      
      <RadioGroup 
        value={selectedValue} 
        onValueChange={handleRadioChange}
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
        
        <div className="flex items-center space-x-2 p-2 rounded border">
          <RadioGroupItem value="custom" id="hours-custom" />
          <Label htmlFor="hours-custom" className="cursor-pointer">Custom time</Label>
        </div>
      </RadioGroup>
      
      {useCustomTime && (
        <div className="mt-4 p-3 border rounded-md">
          <CustomTimeInput 
            hours={hoursThreshold}
            setHours={setHoursThreshold}
            minutes={minutesThreshold}
            setMinutes={setMinutesThreshold}
            label="Custom time threshold"
            description="Specify exact hours and minutes"
          />
        </div>
      )}
    </div>
  );
}
