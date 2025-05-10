
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types/message";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageFormProvider } from "../MessageFormContext";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";
import { TextContent } from "./content/TextContent";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useMessageInitializer } from "@/hooks/useMessageInitializer";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationSelector } from "./LocationSelector";

interface MessageFormValues {
  title: string;
  shareLocation: boolean;
}

export function EditMessageForm({ message, onCancel }: { message: Message, onCancel: () => void }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<MessageFormValues>({
    defaultValues: {
      title: message.title || "",
      shareLocation: message.share_location || false,
    }
  });

  const onSubmit = async (formData: MessageFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get text content from message form context
      const textContent = document.getElementById('content') as HTMLTextAreaElement;
      const content = textContent?.value || "";
      
      // Prepare data for update
      const updateData = {
        title: formData.title,
        share_location: formData.shareLocation,
        content,
        message_type: 'text', // Force message type to text
      };
      
      // Update in database
      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', message.id);
      
      if (error) throw error;
      
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully",
        variant: "default"
      });
      
      // Navigate back to message details
      navigate(`/message/${message.id}`);
    } catch (error: any) {
      console.error("Error updating message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MessageFormProvider>
      <div>
        {/* Call useMessageInitializer inside MessageFormProvider context */}
        <MessageInitializerWrapper message={message} />
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a title for your message" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <MessageTypeTabSelector />
                
                <TextContent />

                <FormField
                  control={form.control}
                  name="shareLocation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Share my location with this message</FormLabel>
                    </FormItem>
                  )}
                />
                
                {form.watch('shareLocation') && <LocationSelector />}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MessageFormProvider>
  );
}

// Helper component to use the hook inside the correct context
function MessageInitializerWrapper({ message }: { message: Message }) {
  const { hasInitialized } = useMessageInitializer(message);
  
  if (!hasInitialized) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Loading message data...</span>
      </div>
    );
  }
  
  return null;
}
