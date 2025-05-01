
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Format label for display
  const formatTimeLabel = (hours: number) => {
    if (hours < 1) {
      return `${hours * 60} minutes`;
    } else if (hours === 1) {
      return "1 hour";
    } else if (hours < 24) {
      return `${hours} hours`;
    } else if (hours === 24) {
      return "24 hours (1 day)";
    } else if (hours === 48) {
      return "48 hours (2 days)";
    } else if (hours === 72) {
      return "72 hours (3 days)";
    } else if (hours === 168) {
      return "168 hours (1 week)";
    } else if (hours === 336) {
      return "336 hours (2 weeks)";
    } else {
      return "720 hours (30 days)";
    }
  };

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
          <SelectValue placeholder="Select time interval" />
        </SelectTrigger>
        <SelectContent>
          {/* Add more granular time options */}
          <SelectItem value="0.5">30 minutes</SelectItem>
          <SelectItem value="1">1 hour</SelectItem>
          <SelectItem value="2">2 hours</SelectItem>
          <SelectItem value="3">3 hours</SelectItem>
          <SelectItem value="4">4 hours</SelectItem>
          <SelectItem value="6">6 hours</SelectItem>
          <SelectItem value="8">8 hours</SelectItem>
          <SelectItem value="12">12 hours</SelectItem>
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
