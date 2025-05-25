
import { useEffect, useState } from 'react';
import { parseReminderMinutes } from '@/utils/reminderUtils';
import { MessageInfoSection } from './MessageInfoSection';
import { DeliverySettingsSection } from './DeliverySettingsSection';
import { ReminderSection } from './ReminderSection';
import { SecuritySettingsSection } from './SecuritySettingsSection';

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
  recipients?: any[];
  isActionLoading?: boolean;
  onSendTestMessage?: () => void;
  renderRecipients?: () => React.ReactNode;
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
  isLoadingDelivery
}: StatusDeliverySectionProps) {
  const [effectiveDeadline, setEffectiveDeadline] = useState<Date | null>(null);
  const [formattedReminders, setFormattedReminders] = useState<string[]>([]);
  
  // Calculate effective deadline for both regular and check-in conditions
  useEffect(() => {
    if (externalDeadline) {
      setEffectiveDeadline(externalDeadline);
    } else if (condition) {
      // Simple deadline calculation
      if (condition.trigger_date) {
        setEffectiveDeadline(new Date(condition.trigger_date));
      } else if (condition.last_checked && (condition.hours_threshold || condition.minutes_threshold)) {
        const deadline = new Date(condition.last_checked);
        if (condition.hours_threshold) {
          deadline.setHours(deadline.getHours() + condition.hours_threshold);
        }
        if (condition.minutes_threshold) {
          deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
        }
        setEffectiveDeadline(deadline);
      } else {
        setEffectiveDeadline(null);
      }
    } else {
      setEffectiveDeadline(null);
    }
  }, [condition, externalDeadline, refreshTrigger]);
  
  if (!condition) return null;
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);

  return (
    <div className="space-y-4">
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
        onFormattedRemindersChange={setFormattedReminders}
      />
      
      <SecuritySettingsSection
        condition={condition}
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
