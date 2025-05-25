
import { useState } from "react";
import { UserDetailModal } from "./user-detail-modal";
import { UserTableProps, AuthUser } from "./user-table/types";
import { useUserData } from "./user-table/useUserData";
import { UserTableContent } from "./user-table/UserTableContent";

export default function UserTable({ filter }: UserTableProps) {
  const { users, loading, error, refetch } = useUserData(filter);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewUser = (user: AuthUser) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleUserDeleted = (userId: string) => {
    // Refresh the user data to update the list
    refetch();
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
        <UserTableContent 
          users={users} 
          onViewUser={handleViewUser}
          onUserDeleted={handleUserDeleted}
        />
      )}
      
      <UserDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
