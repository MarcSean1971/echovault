
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient, TriggerType, RecurringPattern } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { ConditionTypeSelector } from "./DeadManSwitchComponents/ConditionTypeSelector";
import { TimeThresholdSelector } from "./DeadManSwitchComponents/TimeThresholdSelector";
import { RecipientsSelector } from "./RecipientsSelector";
import { DatePicker } from "./DeadManSwitchComponents/DatePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RecurringPatternSelector } from "./DeadManSwitchComponents/RecurringPatternSelector";

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

          {(conditionType === 'no_check_in' || conditionType === 'regular_check_in') && (
            <TimeThresholdSelector
              conditionType={conditionType}
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
            />
          )}
          
          {conditionType === 'scheduled_date' && (
            <div className="space-y-4">
              <DatePicker
                selectedDate={triggerDate}
                setSelectedDate={setTriggerDate}
                label="Select Delivery Date & Time"
              />
              
              <RecurringPatternSelector
                pattern={recurringPattern}
                setPattern={setRecurringPattern}
              />
            </div>
          )}
          
          {conditionType === 'group_confirmation' && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Number of confirmations required</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[confirmationsRequired]}
                    onValueChange={(value) => setConfirmationsRequired(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-medium w-8 text-center">{confirmationsRequired}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Message will be sent when at least {confirmationsRequired} recipient(s) confirm delivery.
                </p>
              </div>
            </div>
          )}
          
          {conditionType === 'panic_trigger' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
              <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                Manual Panic Trigger
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                This will create a message that you can manually trigger in an emergency situation.
                A panic button will be available for you to send this message instantly when needed.
              </p>
            </div>
          )}
          
          <RecipientsSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleRecipientSelect}
            isLoading={isLoading}
          />
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Advanced Options</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin-code">Recipient PIN Code (Optional)</Label>
                <Input 
                  id="pin-code"
                  type="text"
                  placeholder="Enter a PIN code to restrict access"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recipients will need to enter this PIN to access your message.
                </p>
              </div>
              
              <div>
                <Label>Unlock Delay (Hours)</Label>
                <div className="flex items-center space-x-4 mt-1">
                  <Slider
                    value={[unlockDelay]}
                    onValueChange={(value) => setUnlockDelay(value[0])}
                    min={0}
                    max={72}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-medium w-8 text-center">{unlockDelay}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {unlockDelay > 0 
                    ? `Message will be accessible ${unlockDelay} hours after triggering.`
                    : "Message will be accessible immediately upon triggering."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
