
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  initials: string;
}

export function ProfileAvatar({ avatarUrl, initials }: ProfileAvatarProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <Avatar className="h-24 w-24">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="User profile" />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {initials || <User className="h-12 w-12" />}
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
}
