
/**
 * Utility functions for admin functionality
 */

const ADMIN_EMAIL = "marc.s@seelenbinderconsulting.com";

/**
 * Checks if the provided email is an admin email
 */
export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

/**
 * Get admin display name from email
 */
export const getAdminDisplayName = (email?: string | null): string => {
  if (!email || !isAdminEmail(email)) return "Admin";
  return "Marc";
};
