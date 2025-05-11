
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface CheckInCodeInputProps {
  checkInCode: string;
  setCheckInCode: (code: string) => void;
}

export function CheckInCodeInput({
  checkInCode,
  setCheckInCode
}: CheckInCodeInputProps) {
  // Custom check-in code validation
  const isValidCheckInCode = (code: string) => {
    return /^[A-Za-z0-9]+$/.test(code) || code === "";
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="check-in-code">Custom WhatsApp Check-In Code</Label>
      <Input
        id="check-in-code"
        placeholder="CHECKIN" 
        value={checkInCode}
        onChange={(e) => {
          const value = e.target.value.trim();
          if (isValidCheckInCode(value)) {
            setCheckInCode(value);
          }
        }}
        className="max-w-xs hover:bg-muted/80 transition-colors duration-200"
      />
      <p className="text-sm text-muted-foreground">
        Set a custom code for WhatsApp check-ins. Default codes "CHECKIN" and "CODE" will still work.
      </p>
      {checkInCode && !isValidCheckInCode(checkInCode) && (
        <div className="flex items-center text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>Code can only contain letters and numbers without spaces.</span>
        </div>
      )}
    </div>
  );
}
