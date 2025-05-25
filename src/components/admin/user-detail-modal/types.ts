
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  has_profile: boolean;
  profile_complete: boolean;
  first_name: string | null;
  last_name: string | null;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  backup_email?: string | null;
  backup_contact?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
}

export interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export interface ActivityData {
  messagesCount: number;
  recipientsCount: number;
}
