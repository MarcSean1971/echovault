
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimeThresholdSelectorProps {
  conditionType: 'no_check_in' | 'regular_check_in';
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
      <Label htmlFor="hours-threshold" className="mb-2 block">
        {conditionType === 'no_check_in' 
          ? 'Hours without check-in before sending' 
          : 'Send every X hours'}
      </Label>
      <Select 
        value={hoursThreshold.toString()} 
        onValueChange={(value) => setHoursThreshold(Number(value))}
      >
        <SelectTrigger id="hours-threshold">
          <SelectValue placeholder="Select hours" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24">24 hours (1 day)</SelectItem>
          <SelectItem value="48">48 hours (2 days)</SelectItem>
          <SelectItem value="72">72 hours (3 days)</SelectItem>
          <SelectItem value="168">168 hours (1 week)</SelectItem>
          <SelectItem value="336">336 hours (2 weeks)</SelectItem>
          <SelectItem value="720">720 hours (30 days)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
