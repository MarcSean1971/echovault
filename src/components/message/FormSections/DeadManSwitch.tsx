
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryMethodContent } from "./DeadManSwitchComponents/DeliveryMethodContent";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { SecurityOptions } from "./DeadManSwitchComponents/SecurityOptions";
import { Separator } from "@/components/ui/separator";

export function DeadManSwitch() {
  const { 
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold, 
    setMinutesThreshold,
    recurringPattern,
    setRecurringPattern,
    triggerDate,
    setTriggerDate,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours
  } = useMessageForm();
  const { userId } = useAuth();

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-500 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Authentication Required</h3>
          </div>
          <p>You must be logged in to configure delivery triggers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2" />
        <h2 className="text-xl font-medium">Trigger Settings</h2>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            <div>
              <h3 className="font-medium mb-4">Delivery Method</h3>
              <DeliveryMethodContent
                conditionType={conditionType}
                setConditionType={setConditionType}
                hoursThreshold={hoursThreshold}
                setHoursThreshold={setHoursThreshold}
                minutesThreshold={minutesThreshold}
                setMinutesThreshold={setMinutesThreshold}
                deliveryOption={deliveryOption}
                setDeliveryOption={setDeliveryOption}
                recurringPattern={recurringPattern}
                setRecurringPattern={setRecurringPattern}
                triggerDate={triggerDate}
                setTriggerDate={setTriggerDate}
                panicTriggerConfig={panicTriggerConfig}
                setPanicTriggerConfig={setPanicTriggerConfig}
                reminderHours={reminderHours}
                setReminderHours={setReminderHours}
                setActiveTab={() => {}}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Security Options</h3>
              <SecurityOptions
                pinCode={pinCode}
                setPinCode={setPinCode}
                unlockDelay={unlockDelay}
                setUnlockDelay={setUnlockDelay}
                expiryHours={expiryHours}
                setExpiryHours={setExpiryHours}
                setActiveTab={() => {}}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
