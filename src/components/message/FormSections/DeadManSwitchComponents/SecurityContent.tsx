
import { SecurityOptions } from "./SecurityOptions";

interface SecurityContentProps {
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  expiryHours: number;
  setExpiryHours: (value: number) => void;
  setActiveTab: (tab: string) => void;
}

export function SecurityContent({
  pinCode,
  setPinCode,
  unlockDelay,
  setUnlockDelay,
  expiryHours,
  setExpiryHours,
  setActiveTab
}: SecurityContentProps) {
  return (
    <div className="space-y-6">
      <SecurityOptions
        pinCode={pinCode}
        setPinCode={setPinCode}
        unlockDelay={unlockDelay}
        setUnlockDelay={setUnlockDelay}
        expiryHours={expiryHours}
        setExpiryHours={setExpiryHours}
      />
      
      <div className="pt-4 flex justify-start">
        <button 
          type="button"
          onClick={() => setActiveTab("recipients")}
          className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
        >
          Back to Recipients
        </button>
      </div>
    </div>
  );
}
