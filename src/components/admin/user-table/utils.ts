
import { format } from "date-fns";
import { AuthUser } from "./types";

export const formatName = (user: AuthUser) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  } else if (user.first_name) {
    return user.first_name;
  } else {
    return user.email || "Unknown User";
  }
};

export const formatLastSignIn = (lastSignIn: string | null) => {
  if (!lastSignIn) return "Never";
  return format(new Date(lastSignIn), 'PP');
};
