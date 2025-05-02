
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckInCardProps {
  onCheckIn: () => Promise<void>;
  isChecking: boolean;
  panicMode: boolean;
  isLoading: boolean;
}

export function CheckInCard({ onCheckIn, isChecking, panicMode, isLoading }: CheckInCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Regular Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Perform a regular check-in to reset your Dead Man's Switch timers. 
          This confirms your well-being to the system.
        </p>
        <Button 
          onClick={onCheckIn}
          disabled={isChecking || panicMode || isLoading}
          className="w-full"
        >
          {isChecking ? "Checking In..." : "Check In Now"}
        </Button>
      </CardContent>
    </Card>
  );
}
