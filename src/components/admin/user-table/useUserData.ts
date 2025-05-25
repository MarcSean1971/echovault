
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "./types";

export function useUserData(filter: 'all' | 'active' | 'new') {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Call the database function to get all auth users
      const { data, error } = await supabase.rpc('get_all_users_admin');
      
      if (error) throw error;
      
      // Filter users based on the selected filter
      let filteredUsers = data || [];
      
      if (filter === 'active') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filteredUsers = filteredUsers.filter(user => 
          user.last_sign_in_at && new Date(user.last_sign_in_at) >= thirtyDaysAgo
        );
      } else if (filter === 'new') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filteredUsers = filteredUsers.filter(user => 
          new Date(user.created_at) >= sevenDaysAgo
        );
      }
      
      setUsers(filteredUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  return { users, loading, error };
}
