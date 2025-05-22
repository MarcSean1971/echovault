
import { useState } from "react";
import { Key } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface PinEntryProps {
  onSubmit: (pin: string) => Promise<void>;
}

export const PinEntry = ({ onSubmit }: PinEntryProps) => {
  const [pinCode, setPinCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(pinCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <Key className="h-12 w-12 text-purple-500" />
          <h2 className="text-xl font-semibold">Secure Message</h2>
          <p className="text-muted-foreground">This message is protected with a PIN code.</p>
          
          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 mt-4">
            <Input
              type="text"
              placeholder="Enter PIN code"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="text-center text-lg"
              autoFocus
            />
            <Button 
              type="submit" 
              className={`w-full bg-purple-600 hover:bg-purple-700 ${HOVER_TRANSITION}`} 
              disabled={!pinCode || isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Access Message"}
            </Button>
          </form>
          
          <p className="text-sm text-muted-foreground mt-4">
            If you don't know the PIN code, please contact the sender.
          </p>
        </div>
      </Card>
    </div>
  );
};
