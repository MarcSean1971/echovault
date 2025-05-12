
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PatternOptionProps } from "./types";

export function IntervalSelector({ pattern, setPattern }: PatternOptionProps) {
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value) || 1;
    if (pattern) {
      setPattern({ ...pattern, interval: Math.max(1, interval) });
    }
  };
  
  return (
    <div>
      <Label htmlFor="recurring-interval" className="mb-2 block">
        Every
        {pattern?.type === 'daily' ? ' X days' : ''}
        {pattern?.type === 'weekly' ? ' X weeks' : ''}
        {pattern?.type === 'monthly' ? ' X months' : ''}
        {pattern?.type === 'yearly' ? ' X years' : ''}
      </Label>
      <Input
        id="recurring-interval"
        type="number"
        min={1}
        value={pattern?.interval || 1}
        onChange={handleIntervalChange}
      />
    </div>
  );
}
