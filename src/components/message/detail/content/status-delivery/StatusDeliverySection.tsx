
import { useEffect, useState } from 'react';
import { getEffectiveDeadline, parseReminderMinutes } from '@/utils/reminderUtils';
import { MessageInfoSection } from './MessageInfoSection';
import { DeliverySettingsSection } from './DeliverySettingsSection';
import { ReminderSection } from './ReminderSection';

interface StatusDeliverySectionProps {
  message: any;
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  isArmed?: boolean;
  refreshTrigger?: number;
}

export function StatusDeliverySection({ 
  message, 
  condition, 
  formatDate, 
  renderConditionType,
  isArmed = false,
  refreshTrigger
}: StatusDeliverySectionProps) {
  const [effectiveDeadline, setEffectiveDeadline] = useState<Date | null>(null);
  
  // Calculate effective deadline for both regular and check-in conditions
  useEffect(() => {
    if (condition) {
      setEffectiveDeadline(getEffectiveDeadline(condition));
    } else {
      setEffectiveDeadline(null);
    }
  }, [condition, refreshTrigger]);
  
  if (!condition) return null;
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);

  return (
    <div className="grid gap-8">
      <MessageInfoSection
        message={message}
        formatDate={formatDate}
      />
      
      <DeliverySettingsSection
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        deadline={effectiveDeadline}
        isArmed={isArmed}
        refreshTrigger={refreshTrigger}
      />
      
      <ReminderSection
        condition={condition}
        deadline={effectiveDeadline}
        isArmed={isArmed}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
