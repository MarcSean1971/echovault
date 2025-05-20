
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
      return "Trigger Switch"; // Changed from "Dead Man's Switch"
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

// Instead of returning JSX, we'll use a function that returns a React element
// but we need to import React in the components that use this function
export const renderRecipientsList = (condition: any) => {
  if (!condition?.recipients || condition.recipients.length === 0) {
    return null; // Return null instead of JSX
  }

  // Return the data structure for recipients - components will render this
  return condition.recipients.map((recipient: any, index: number) => ({
    id: index,
    name: recipient.name,
    email: recipient.email
  }));
};
