
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileData, ProfileUpdateData } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

// Form validation schema
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  backup_email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  whatsapp_number: z.string().regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format").or(z.literal("")).optional(),
  backup_contact: z.string().regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format").or(z.literal("")).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: ProfileData | null;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

export function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const isMobile = useIsMobile();
  
  // Set up the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      backup_email: profile?.backup_email || "",
      whatsapp_number: profile?.whatsapp_number || "",
      backup_contact: profile?.backup_contact || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="mb-8">
          <CardHeader>
            {/* Title and description removed as requested */}
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} className={HOVER_TRANSITION} />
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
                    <Input placeholder="Last name" {...field} className={HOVER_TRANSITION} />
                  </FormControl>
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
                    <Input type="email" placeholder="backup@example.com" {...field} className={HOVER_TRANSITION} />
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
                    <Input placeholder="+1 234 567 8900" {...field} className={HOVER_TRANSITION} />
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
                    <Input placeholder="+1 234 567 8900" {...field} className={HOVER_TRANSITION} />
                  </FormControl>
                  <FormDescription>
                    An alternative phone number where you can be reached
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className={isMobile ? "" : "flex justify-end"}>
            <Button 
              type="submit" 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} gap-2 shadow-sm hover:shadow-md ${isMobile ? 'w-full' : ''}`}
              size={isMobile ? "default" : "lg"}
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
