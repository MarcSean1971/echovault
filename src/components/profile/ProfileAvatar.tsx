
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { uploadProfileAvatar } from "@/services/profileService";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  initials: string;
  onAvatarUpdate?: (url: string) => void;
}

export function ProfileAvatar({ avatarUrl, initials, onAvatarUpdate }: ProfileAvatarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const avatarUrl = await uploadProfileAvatar(file);
      if (avatarUrl && onAvatarUpdate) {
        onAvatarUpdate(avatarUrl);
        toast({
          title: "Avatar updated",
          description: "Your profile image has been updated",
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center justify-center mb-8">
      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Avatar 
          className={`h-24 w-24 ${!isUploading && "cursor-pointer"}`}
          onClick={handleAvatarClick}
        >
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="User profile" />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {initials || <User className="h-12 w-12" />}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Upload overlay */}
        {isHovering && !isUploading && (
          <div 
            className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center ${HOVER_TRANSITION}`}
            onClick={handleAvatarClick}
          >
            <Upload className="text-white h-8 w-8" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="text-white h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
