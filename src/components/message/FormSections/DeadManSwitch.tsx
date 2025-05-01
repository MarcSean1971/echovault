
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Recipient } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { ConditionTypeSelector } from "./DeadManSwitchComponents/ConditionTypeSelector";
import { TimeThresholdSelector } from "./DeadManSwitchComponents/TimeThresholdSelector";
import { RecipientsSelector } from "./RecipientsSelector";

interface DeadManSwitchProps {
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  conditionType: 'no_check_in' | 'regular_check_in';
  setConditionType: (value: 'no_check_in' | 'regular_check_in') => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  userId: string | null;
}

export function DeadManSwitch({
  enableDeadManSwitch,
  setEnableDeadManSwitch,
  conditionType,
  setConditionType,
  hoursThreshold,
  setHoursThreshold,
  selectedRecipients,
  setSelectedRecipients,
  userId
}: DeadManSwitchProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available recipients when component mounts
  useEffect(() => {
    if (!userId || !enableDeadManSwitch) return;

    const loadRecipients = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error) {
        console.error("Error fetching recipients:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipients();
  }, [userId, enableDeadManSwitch]);

  // Fix: Use an arrow function that returns the new array instead of a function that modifies prev
  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipients(
      selectedRecipients.includes(recipientId)
        ? selectedRecipients.filter(id => id !== recipientId)
        : [...selectedRecipients, recipientId]
    );
  };

  if (!enableDeadManSwitch) {
    return <SwitchToggle
      enableDeadManSwitch={enableDeadManSwitch}
      setEnableDeadManSwitch={setEnableDeadManSwitch}
    />;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <SwitchToggle 
          enableDeadManSwitch={enableDeadManSwitch}
          setEnableDeadManSwitch={setEnableDeadManSwitch}
          showLabel={true}
        />

        <div className="space-y-4">
          <ConditionTypeSelector
            conditionType={conditionType}
            setConditionType={setConditionType}
          />

          <TimeThresholdSelector
            conditionType={conditionType}
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
          />

          <RecipientsSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleRecipientSelect}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
