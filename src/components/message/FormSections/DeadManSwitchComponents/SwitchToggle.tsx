
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SwitchToggleProps {
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  showLabel?: boolean;
}

export function SwitchToggle({
  enableDeadManSwitch,
  setEnableDeadManSwitch,
  showLabel = false
}: SwitchToggleProps) {
  if (!showLabel) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="dead-man-switch"
              checked={enableDeadManSwitch}
              onCheckedChange={setEnableDeadManSwitch}
            />
            <Label htmlFor="dead-man-switch">
              Enable trigger switch
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="dead-man-switch-enabled" className="font-medium text-lg">
        Trigger Switch
      </Label>
      <Switch
        id="dead-man-switch-enabled"
        checked={enableDeadManSwitch}
        onCheckedChange={setEnableDeadManSwitch}
      />
    </div>
  );
}
