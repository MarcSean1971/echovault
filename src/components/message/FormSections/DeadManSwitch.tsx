
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient, TriggerType, RecurringPattern } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { ConditionTypeSelector } from "./DeadManSwitchComponents/ConditionTypeSelector";
import { TimeThresholdSelector } from "./DeadManSwitchComponents/TimeThresholdSelector";
import { RecipientsSelector } from "./RecipientsSelector";
import { ScheduledDateSection } from "./DeadManSwitchComponents/ScheduledDateSection";
import { GroupConfirmation } from "./DeadManSwitchComponents/GroupConfirmation";
import { PanicTrigger } from "./DeadManSwitchComponents/PanicTrigger";
import { AdvancedOptions } from "./DeadManSwitchComponents/AdvancedOptions";

interface DeadManSwitchProps {
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  userId: string | null;
  triggerDate: Date | undefined;
  setTriggerDate: (value: Date | undefined) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (value: RecurringPattern | null) => void;
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
  userId,
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern
}: DeadManSwitchProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationsRequired, setConfirmationsRequired] = useState(3);
  const [pinCode, setPinCode] = useState("");
  const [unlockDelay, setUnlockDelay] = useState(0);
  
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

  // Handle recipient selection
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

          {(conditionType === 'no_check_in' || conditionType === 'regular_check_in') && (
            <TimeThresholdSelector
              conditionType={conditionType}
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
            />
          )}
          
          {conditionType === 'scheduled_date' && (
            <ScheduledDateSection
              triggerDate={triggerDate}
              setTriggerDate={setTriggerDate}
              recurringPattern={recurringPattern}
              setRecurringPattern={setRecurringPattern}
            />
          )}
          
          {conditionType === 'group_confirmation' && (
            <GroupConfirmation
              confirmationsRequired={confirmationsRequired}
              setConfirmationsRequired={setConfirmationsRequired}
            />
          )}
          
          {conditionType === 'panic_trigger' && (
            <PanicTrigger />
          )}
          
          <RecipientsSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleRecipientSelect}
            isLoading={isLoading}
          />
          
          <AdvancedOptions
            pinCode={pinCode}
            setPinCode={setPinCode}
            unlockDelay={unlockDelay}
            setUnlockDelay={setUnlockDelay}
          />
        </div>
      </CardContent>
    </Card>
  );
}
