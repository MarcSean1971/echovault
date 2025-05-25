
import React from "react";
import { useProfileData } from "@/hooks/useProfileData";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileLoading } from "@/components/profile/ProfileLoading";

export default function Profile() {
  const { profile, isLoading, handleSubmit, initials, handleAvatarUpdate } = useProfileData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <ProfileHeader />
        
        <ProfileAvatar 
          avatarUrl={profile?.avatar_url || null}
          initials={initials}
          onAvatarUpdate={handleAvatarUpdate}
        />
        
        {isLoading ? (
          <ProfileLoading />
        ) : (
          <ProfileForm 
            profile={profile}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
