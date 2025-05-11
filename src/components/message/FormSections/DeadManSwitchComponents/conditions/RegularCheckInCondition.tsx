
import { TimeThresholdSelector } from "../TimeThresholdSelector";
import { TriggerType } from "@/types/message";

interface RegularCheckInConditionProps {
  conditionType: TriggerType;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  renderCustomCheckInCode: () => React.ReactNode;
}

export function RegularCheckInCondition({
  conditionType,
  hoursThreshold,
  setHoursThreshold,
  renderCustomCheckInCode
}: RegularCheckInConditionProps) {
  return (
    <div className="space-y-6">
      <TimeThresholdSelector
        conditionType={conditionType}
        hoursThreshold={hoursThreshold}
        setHoursThreshold={setHoursThreshold}
      />
      {/* Add custom check-in code input */}
      {renderCustomCheckInCode()}
    </div>
  );
}
