
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

export function Footer() {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'EchoVault - Your Secure Digital Failsafe',
      text: 'Secure message delivery system for when it matters most',
      url: window.location.origin
    };

    try {
      // Check if we're on HTTPS (required for clipboard API)
      const isHttps = window.location.protocol === 'https:';
      
      // Use Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Thanks for sharing EchoVault!"
        });
        return;
      }

      // Try clipboard API if on HTTPS
      if (isHttps && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied!",
          description: "EchoVault link has been copied to your clipboard"
        });
        return;
      }

      // Fallback: Create temporary input element for manual copying
      const tempInput = document.createElement('input');
      tempInput.value = window.location.origin;
      document.body.appendChild(tempInput);
      tempInput.select();
      tempInput.setSelectionRange(0, 99999); // For mobile devices

      // Try document.execCommand as fallback
      const successful = document.execCommand('copy');
      document.body.removeChild(tempInput);

      if (successful) {
        toast({
          title: "Link copied!",
          description: "EchoVault link has been copied to your clipboard"
        });
      } else {
        // Final fallback: Show the URL for manual copying
        toast({
          title: "Manual copy needed",
          description: `Please copy this URL manually: ${window.location.origin}`,
          duration: 10000 // Show longer for manual copying
        });
      }

    } catch (error) {
      // Handle share cancellation or errors gracefully
      if (error.name === 'AbortError') {
        // User cancelled the share dialog, don't show error
        return;
      }

      console.error('Share failed:', error);
      
      // Show helpful error message with manual copy option
      toast({
        title: "Share not available",
        description: `Please copy this URL manually: ${window.location.origin}`,
        duration: 10000,
        variant: "destructive"
      });
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
                className={`text-muted-foreground hover:text-primary ${BUTTON_HOVER_EFFECTS.ghost}`}
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
