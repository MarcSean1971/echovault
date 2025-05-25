
import { useState } from "react";
import { Key } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="p-6 bg-white border-gray-300 shadow-lg">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 border-2 border-purple-200 mb-2">
            <Key className={`h-8 w-8 text-purple-600 ${HOVER_TRANSITION}`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Secure Message</h2>
          <p className="text-gray-600 max-w-md">This message is protected with a PIN code. Please enter the code to access the content.</p>
          
          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 mt-6">
            <Input
              type="text"
              placeholder="Enter PIN code"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="text-center text-lg bg-white border-gray-400 focus:border-purple-500 text-gray-900"
              autoFocus
            />
            <button
              type="submit" 
              className={`w-full px-4 py-2 !bg-purple-500 hover:!bg-purple-600 !text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${HOVER_TRANSITION}`}
              disabled={!pinCode || isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Access Message"}
            </button>
          </form>
          
          <p className="text-sm text-gray-600 mt-4 max-w-md">
            If you don't know the PIN code, please contact the sender for assistance.
          </p>
        </div>
      </Card>
    </div>
  );
};
