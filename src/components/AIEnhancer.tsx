
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIEnhancerProps {
  content: string;
  onChange: (newContent: string) => void;
}

type EnhancementType = "improve" | "professional" | "summarize" | "expand";

export function AIEnhancer({ content, onChange }: AIEnhancerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("improve");
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState("");
  const originalContentRef = useRef<string>("");

  const handleEnhance = async () => {
    if (!content) {
      toast({
        title: "Empty content",
        description: "Please add some content to enhance",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    originalContentRef.current = content;

    try {
      const { data, error } = await supabase.functions.invoke("enhance-message", {
        body: {
          text: content,
          enhancementType,
        },
      });

      if (error) throw error;

      setEnhancedContent(data.enhancedText);
    } catch (error: any) {
      console.error("Error enhancing message:", error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Failed to enhance your message",
        variant: "destructive",
      });
      setEnhancedContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onChange(enhancedContent);
    setIsOpen(false);
    toast({
      title: "Enhancement applied",
      description: "Your message has been updated with AI enhancements",
    });
  };

  const handleCancel = () => {
    setEnhancedContent("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Wand className="h-4 w-4" />
          Enhance with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enhance Your Message with AI</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="enhancementType">Enhancement Type</Label>
            <Select
              value={enhancementType}
              onValueChange={(value) => setEnhancementType(value as EnhancementType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select enhancement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Enhancement Options</SelectLabel>
                  <SelectItem value="improve">Improve Writing</SelectItem>
                  <SelectItem value="professional">Make Professional</SelectItem>
                  <SelectItem value="summarize">Summarize</SelectItem>
                  <SelectItem value="expand">Expand Content</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {!enhancedContent ? (
            <div className="space-y-2">
              <Label htmlFor="original">Your Content</Label>
              <Textarea
                id="original"
                value={content}
                readOnly
                className="min-h-[150px]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="enhanced">Enhanced Content</Label>
              <Textarea
                id="enhanced"
                value={enhancedContent}
                onChange={(e) => setEnhancedContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          {!enhancedContent ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleEnhance} disabled={isLoading || !content}>
                {isLoading ? "Enhancing..." : "Generate Enhancement"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                Apply Enhancement
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
