
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface GroupConfirmationProps {
  confirmationsRequired: number;
  setConfirmationsRequired: (value: number) => void;
}

export function GroupConfirmation({
  confirmationsRequired,
  setConfirmationsRequired
}: GroupConfirmationProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Number of confirmations required</Label>
        <div className="flex items-center space-x-4">
          <Slider
            value={[confirmationsRequired]}
            onValueChange={(value) => setConfirmationsRequired(value[0])}
            min={1}
            max={10}
            step={1}
            className="flex-1"
          />
          <span className="font-medium w-8 text-center">{confirmationsRequired}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Message will be sent when at least {confirmationsRequired} recipient(s) confirm delivery.
        </p>
      </div>
    </div>
  );
}
