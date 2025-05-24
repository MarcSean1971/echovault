
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function Footer() {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'EchoVault - Your Secure Digital Failsafe',
      text: 'Secure message delivery system for when it matters most',
      url: window.location.origin
    };

    try {
      // Use Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Thanks for sharing EchoVault!"
        });
      } else {
        // Fallback to clipboard for desktop
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied!",
          description: "EchoVault link has been copied to your clipboard"
        });
      }
    } catch (error) {
      // Handle share cancellation or errors gracefully
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          title: "Share failed",
          description: "Please try copying the link manually",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <footer className="bg-muted/40 py-8">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-serif font-bold gradient-text">EchoVault</h2>
            <p className="text-sm text-muted-foreground">Your secure digital failsafe</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center space-x-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className={`text-muted-foreground hover:text-primary ${HOVER_TRANSITION}`}
                aria-label="Share EchoVault"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EchoVault. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-2">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
