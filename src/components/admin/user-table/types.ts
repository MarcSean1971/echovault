
export type AuthUser = {
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
};

export interface UserTableProps {
  filter: 'all' | 'active' | 'new';
}
