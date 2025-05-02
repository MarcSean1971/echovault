
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getConditionType = (condition: any) => {
  if (!condition) return "Not set";
  
  switch (condition.condition_type) {
    case 'no_check_in':
      return "Dead Man's Switch";
    case 'panic_trigger':
      return "Panic Trigger";
    case 'inactivity_to_date':
      return "Scheduled Delivery";
    case 'inactivity_to_recurring':
      return "Recurring Delivery";
    default:
      return condition.condition_type.replace(/_/g, ' ');
  }
};

export const renderRecipientsList = (condition: any) => {
  if (!condition?.recipients || condition.recipients.length === 0) {
    return <p className="text-muted-foreground text-sm">No recipients</p>;
  }

  return (
    <div className="space-y-2">
      {condition.recipients.map((recipient: any, index: number) => (
        <div key={index} className="flex items-center text-sm">
          <span className="font-medium">{recipient.name}</span>
          <span className="text-muted-foreground ml-2 text-xs">({recipient.email})</span>
        </div>
      ))}
    </div>
  );
};
