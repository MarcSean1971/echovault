
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfile, updateProfile, ProfileUpdateData, ProfileData } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

// Form validation schema
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  backup_email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  whatsapp_number: z.string().regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format").or(z.literal("")).optional(),
  backup_contact: z.string().regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format").or(z.literal("")).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { userId, getInitials } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      backup_email: "",
      whatsapp_number: "",
      backup_contact: "",
    },
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const profileData = await fetchProfile(userId);
        
        if (profileData) {
          setProfile(profileData);
          
          // Set form default values
          form.reset({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            backup_email: profileData.backup_email || "",
            whatsapp_number: profileData.whatsapp_number || "",
            backup_contact: profileData.backup_contact || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [userId, form]);

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!userId) return;
    
    try {
      const updateData: ProfileUpdateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        backup_email: values.backup_email || null,
        whatsapp_number: values.whatsapp_number || null,
        backup_contact: values.backup_contact || null,
      };
      
      const updatedProfile = await updateProfile(userId, updateData);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    }
  };

  const initials = profile ? 
    `${(profile.first_name?.[0] || "")}${(profile.last_name?.[0] || "")}`.toUpperCase() : 
    getInitials();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>
        
        <div className="flex items-center justify-center mb-8">
          <Avatar className="h-24 w-24">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="User profile" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials || <User className="h-12 w-12" />}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {isLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading profile information...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal information. This information will be used in communications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="backup_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="backup@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          A secondary email that can be used if your primary email is unavailable.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your WhatsApp number with country code (e.g., +1 for USA)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="backup_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormDescription>
                          An alternative phone number where you can be reached
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto">
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
