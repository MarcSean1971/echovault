
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileData, ProfileUpdateData } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { checkProfileCompletion } from "@/utils/profileCompletion";

// Form validation schema - email is NOT included since it's read-only
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  whatsapp_number: z.string().min(1, "WhatsApp number is required").regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  backup_email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  backup_contact: z.string().regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format").or(z.literal("")).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: ProfileData | null;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

export function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const isMobile = useIsMobile();
  const completionStatus = checkProfileCompletion(profile);
  
  // Set up the form - email is excluded from form data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      whatsapp_number: profile?.whatsapp_number || "",
      backup_email: profile?.backup_email || "",
      backup_contact: profile?.backup_contact || "",
    },
  });

  const isFormValid = form.formState.isValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="mb-8">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Last name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Email - Display only, not part of the form */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Primary Email
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {profile?.email || "Loading..."}
              </div>
              <p className="text-sm text-muted-foreground">
                Your primary email address from your account (read-only)
              </p>
            </div>

            <FormField
              control={form.control}
              name="whatsapp_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number <span className="text-red-500">*</span></FormLabel>
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
              name="backup_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backup Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="backup@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    A secondary email that can be used if your primary email is unavailable (optional)
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
                    An alternative phone number with country code (e.g., +1 for USA) where you can be reached (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className={isMobile ? "" : "flex justify-end"}>
            <Button 
              type="submit" 
              className={`${BUTTON_HOVER_EFFECTS.default} gap-2 shadow-sm hover:shadow-md ${isMobile ? 'w-full' : ''}`}
              size={isMobile ? "default" : "lg"}
              disabled={!isFormValid}
            >
              {completionStatus.isComplete ? 'Save Changes' : 'Complete Profile'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
