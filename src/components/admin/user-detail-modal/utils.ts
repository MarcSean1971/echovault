
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
  if (!user.first_name) missing.push('First name');
  if (!user.last_name) missing.push('Last name');
  if (!profileData?.email) missing.push('Email in profile');
  
  return missing;
};
