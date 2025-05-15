
import { useEffect, useState } from 'react';
import { getEffectiveDeadline, parseReminderMinutes } from '@/utils/reminderUtils';
import { MessageInfoSection } from './MessageInfoSection';
import { DeliverySettingsSection } from './DeliverySettingsSection';
import { ReminderSection } from './ReminderSection';
import { DeadmanSwitchControls } from '../deadman/DeadmanSwitchControls';

interface StatusDeliverySectionProps {
  message: any;
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  isArmed?: boolean;
  refreshTrigger?: number;
  deadline?: Date | null;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  handleForceDelivery?: () => Promise<void>;
}

export function StatusDeliverySection({ 
  message, 
  condition, 
  formatDate, 
  renderConditionType,
  isArmed = false,
  refreshTrigger,
  deadline: externalDeadline,
  lastCheckIn,
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  handleForceDelivery
}: StatusDeliverySectionProps) {
  const [effectiveDeadline, setEffectiveDeadline] = useState<Date | null>(null);
  
  // Calculate effective deadline for both regular and check-in conditions
  useEffect(() => {
    if (externalDeadline) {
      console.log(`[StatusDeliverySection] Using external deadline: ${externalDeadline.toISOString()}`);
      setEffectiveDeadline(externalDeadline);
    } else if (condition) {
      const calculatedDeadline = getEffectiveDeadline(condition);
      console.log(`[StatusDeliverySection] Calculated deadline: ${calculatedDeadline ? calculatedDeadline.toISOString() : 'null'}`);
      setEffectiveDeadline(calculatedDeadline);
    } else {
      setEffectiveDeadline(null);
    }
  }, [condition, externalDeadline, refreshTrigger]);
  
  if (!condition) return null;
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);
  
  // Check if this is a deadman's switch condition
  const isDeadmanSwitch = condition.condition_type === 'no_check_in';

  return (
    <div className="grid gap-4">
      <MessageInfoSection
        message={message}
        formatDate={formatDate}
        lastDelivered={lastDelivered}
        viewCount={viewCount}
        lastCheckIn={lastCheckIn}
        checkInCode={checkInCode}
        condition={condition}
      />
      
      <DeliverySettingsSection
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        deadline={effectiveDeadline}
        isArmed={isArmed}
        refreshTrigger={refreshTrigger}
        onDeadlineReached={isDeadmanSwitch && handleForceDelivery ? handleForceDelivery : undefined}
      />
      
      {/* Add Deadman Switch Controls for no_check_in condition types */}
      {isDeadmanSwitch && (
        <DeadmanSwitchControls
          messageId={message.id}
          reminderMinutes={reminderMinutes}
          isArmed={isArmed}
          onForceDelivery={handleForceDelivery}
        />
      )}
      
      <ReminderSection
        condition={condition}
        deadline={effectiveDeadline}
        isArmed={isArmed}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
