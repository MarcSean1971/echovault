
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, UserX, CheckCircle, XCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import UserDetailModal from "./UserDetailModal";

type AuthUser = {
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

interface UserTableProps {
  filter: 'all' | 'active' | 'new';
}

export default function UserTable({ filter }: UserTableProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  useEffect(() => {
    fetchUsers();
  }, [filter]);

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

  const handleViewUser = (user: AuthUser) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const formatName = (user: AuthUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return user.email || "Unknown User";
    }
  };

  const formatLastSignIn = (lastSignIn: string | null) => {
    if (!lastSignIn) return "Never";
    return format(new Date(lastSignIn), 'PP');
  };

  const getProfileBadge = (user: AuthUser) => {
    if (!user.has_profile) {
      return (
        <Badge variant="secondary">
          <User className="h-3 w-3 mr-1" />Not Started
        </Badge>
      );
    } else if (user.profile_complete) {
      return (
        <Badge variant="default">
          <User className="h-3 w-3 mr-1" />Complete
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <User className="h-3 w-3 mr-1" />Incomplete
        </Badge>
      );
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-primary font-medium">Loading users...</div>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Email Status</TableHead>
                <TableHead className="hidden lg:table-cell">Profile</TableHead>
                <TableHead className="hidden md:table-cell">Last Sign In</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formatName(user)}</span>
                        <span className="text-sm text-muted-foreground md:hidden">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{user.email}</span>
                        <Badge variant={user.email_confirmed_at ? "default" : "destructive"} className="w-fit">
                          {user.email_confirmed_at ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Verified</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Unverified</>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getProfileBadge(user)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatLastSignIn(user.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(user.created_at), 'PP')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewUser(user)}
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      <UserDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
