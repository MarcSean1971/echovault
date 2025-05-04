
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface PinProtectedMessageProps {
  pinError: string | null;
  verifyingPin: boolean;
  onVerifyPin: (e: React.FormEvent, pin: string) => void;
}

export function PinProtectedMessage({ 
  pinError, 
  verifyingPin, 
  onVerifyPin 
}: PinProtectedMessageProps) {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    onVerifyPin(e, pin);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="w-full max-w-lg p-8 mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Secure Message</h1>
        <p className="mb-4 text-center">This message is protected with a PIN.</p>
        
        <form onSubmit={handleSubmit}>
          {pinError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pinError}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-4">
            <Input 
              type="text" 
              placeholder="Enter PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-xl letter-spacing-wide"
              maxLength={6}
            />
          </div>
          
          <Button 
            type="submit" 
            className={`w-full ${HOVER_TRANSITION}`}
            disabled={verifyingPin}
          >
            {verifyingPin ? <Spinner size="sm" className="mr-2" /> : null}
            Verify PIN
          </Button>
        </form>
        
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className={`flex items-center gap-2 ${HOVER_TRANSITION}`}
          >
            <ArrowLeft className={`h-4 w-4 ${ICON_HOVER_EFFECTS.default}`} />
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
