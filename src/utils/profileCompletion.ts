
import { ProfileData } from "@/services/profileService";

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export function checkProfileCompletion(profile: ProfileData | null): ProfileCompletionStatus {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['Complete profile setup required'],
      completionPercentage: 0
    };
  }

  const requiredFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'whatsapp_number', label: 'WhatsApp Number' }
  ];

  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    const value = profile[field.key as keyof ProfileData];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field.label);
    }
  });

  const completionPercentage = Math.round(
    ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
  );

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage
  };
}
