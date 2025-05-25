
import { AuthUser, UserProfile } from "./types";

export const getUserInitials = (user: AuthUser | null): string => {
  if (!user) return "U";
  
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  } else if (user.first_name) {
    return user.first_name[0].toUpperCase();
  } else if (user.email) {
    return user.email[0].toUpperCase();
  }
  return "U";
};

export const getUserFullName = (user: AuthUser | null): string => {
  if (!user) return "Unknown User";
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  } else if (user.first_name) {
    return user.first_name;
  } else {
    return user.email || "User";
  }
};

export const getMissingFields = (user: AuthUser | null, profileData: UserProfile | null): string[] => {
  if (!user?.has_profile) {
    return ['Profile setup required'];
  }
  
  const missing = [];
  
  // Check basic profile fields
  if (!user.first_name && !profileData?.first_name) missing.push('First name');
  if (!user.last_name && !profileData?.last_name) missing.push('Last name');
  if (!profileData?.email) missing.push('Email in profile');
  
  // Check additional required fields for completion
  if (!profileData?.backup_email) missing.push('Backup email');
  if (!profileData?.backup_contact) missing.push('Backup contact');
  if (!profileData?.whatsapp_number) missing.push('WhatsApp number');
  
  return missing;
};

export const getProfileCompletionPercentage = (user: AuthUser | null, profileData: UserProfile | null): number => {
  if (!user?.has_profile) return 0;
  
  const totalFields = 6; // first_name, last_name, email, backup_email, backup_contact, whatsapp_number
  let completedFields = 0;
  
  if (user.first_name || profileData?.first_name) completedFields++;
  if (user.last_name || profileData?.last_name) completedFields++;
  if (profileData?.email) completedFields++;
  if (profileData?.backup_email) completedFields++;
  if (profileData?.backup_contact) completedFields++;
  if (profileData?.whatsapp_number) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};
