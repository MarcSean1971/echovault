
import { Button } from "@/components/ui/button";

interface MessageTypeUnavailableProps {
  type: string;
}

export function MessageTypeUnavailable({ type }: MessageTypeUnavailableProps) {
  return (
    <div className="space-y-2 text-center p-6 border rounded-md">
      <p className="mb-4">{type} functionality coming soon!</p>
      <Button type="button" disabled>Record {type}</Button>
    </div>
  );
}
