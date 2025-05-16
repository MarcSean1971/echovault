
import { useEffect, useState, memo, Suspense } from 'react';
import { getEffectiveDeadline, parseReminderMinutes } from '@/utils/reminderUtils';
import { MessageInfoSection } from './MessageInfoSection';
import { DeliverySettingsSection } from './DeliverySettingsSection';
import { ReminderSection } from './ReminderSection';
import { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the DeadmanSwitchControls component
const DeadmanSwitchControls = lazy(() => import('../deadman/DeadmanSwitchControls').then(mod => ({
  default: mod.DeadmanSwitchControls
})));

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

// Use memo to prevent unnecessary re-renders
export const StatusDeliverySection = memo(function StatusDeliverySection({ 
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
  const [isDeadmanSwitch, setIsDeadmanSwitch] = useState(false);
  
  // Calculate effective deadline for both regular and check-in conditions
  useEffect(() => {
    if (externalDeadline) {
      setEffectiveDeadline(externalDeadline);
    } else if (condition) {
      const calculatedDeadline = getEffectiveDeadline(condition);
      setEffectiveDeadline(calculatedDeadline);
    } else {
      setEffectiveDeadline(null);
    }
    
    // Check if this is a deadman switch condition
    if (condition?.condition_type === 'no_check_in') {
      setIsDeadmanSwitch(true);
    } else {
      setIsDeadmanSwitch(false);
    }
  }, [condition, externalDeadline, refreshTrigger]);
  
  if (!condition) return null;
  
  // Parse reminder minutes from the condition
  const reminderMinutes = parseReminderMinutes(condition?.reminder_hours);

  return (
    <div className="grid gap-4">
      {/* Message Info Section - always load this first */}
      <MessageInfoSection
        message={message}
        formatDate={formatDate}
        lastDelivered={lastDelivered}
        viewCount={viewCount}
        lastCheckIn={lastCheckIn}
        checkInCode={checkInCode}
        condition={condition}
      />
      
      {/* Delivery Settings Section - always load this next */}
      <DeliverySettingsSection
        condition={condition}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        deadline={effectiveDeadline}
        isArmed={isArmed}
        refreshTrigger={refreshTrigger}
        onDeadlineReached={isDeadmanSwitch && handleForceDelivery ? handleForceDelivery : undefined}
      />
      
      {/* Lazy load Deadman Switch Controls for better performance */}
      {isDeadmanSwitch && (
        <Suspense fallback={
          <div className="animate-pulse">
            <Skeleton className="h-[120px] w-full rounded-md" />
          </div>
        }>
          <DeadmanSwitchControls
            messageId={message.id}
            reminderMinutes={reminderMinutes}
            isArmed={isArmed}
            onForceDelivery={handleForceDelivery}
          />
        </Suspense>
      )}
      
      {/* Lazy load Reminder Section as it's less critical */}
      <Suspense fallback={
        <div className="animate-pulse">
          <Skeleton className="h-[80px] w-full rounded-md" />
        </div>
      }>
        <ReminderSection
          condition={condition}
          deadline={effectiveDeadline}
          isArmed={isArmed}
          refreshTrigger={refreshTrigger}
        />
      </Suspense>
    </div>
  );
});

// Export for simplified import
export default StatusDeliverySection;
