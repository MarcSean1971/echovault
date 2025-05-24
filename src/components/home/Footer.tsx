
import { Link } from "react-router-dom";
import { Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BUTTON_HOVER_EFFECTS, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        return;
      }

      // Try modern clipboard API (requires HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied!",
          description: "EchoVault link has been copied to your clipboard"
        });
        return;
      }

      // Fallback: Create temporary input element for manual copying
      const tempInput = document.createElement('input');
      tempInput.style.position = 'fixed';
      tempInput.style.left = '-9999px';
      tempInput.value = window.location.origin;
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();

      // Try legacy copy command
      const successful = document.execCommand && document.execCommand('copy');
      document.body.removeChild(tempInput);

      if (successful) {
        toast({
          title: "Link copied!",
          description: "EchoVault link has been copied to your clipboard"
        });
      } else {
        // Final fallback: Show the URL for manual copying
        toast({
          title: "Copy manually",
          description: `Copy this URL: ${window.location.origin}`,
          duration: 8000
        });
      }

    } catch (error) {
      // Handle share cancellation or errors gracefully
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Share failed:', error);
      toast({
        title: "Copy manually",
        description: `Copy this URL: ${window.location.origin}`,
        duration: 8000
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('EchoVault - Your Secure Digital Failsafe');
    const text = encodeURIComponent('Check out EchoVault - a secure message delivery system for when it matters most');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <footer className="bg-gradient-to-r from-muted/30 to-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-serif font-bold gradient-text mb-2">EchoVault</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your secure digital failsafe. Ensuring your important messages reach the right people at the right time.
              </p>
            </div>
          </div>

          {/* Social Media & Sharing */}
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <h3 className="font-semibold mb-4 text-foreground">Share EchoVault</h3>
              
              {/* Primary Share Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className={`mb-4 ${BUTTON_HOVER_EFFECTS.outline}`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share EchoVault with others</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Separator className="w-24" />

            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSocialShare('facebook')}
                      className={`${BUTTON_HOVER_EFFECTS.ghost} text-muted-foreground hover:text-[#1877F2]`}
                    >
                      <Facebook className={`h-5 w-5 ${ICON_HOVER_EFFECTS.default}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on Facebook</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSocialShare('twitter')}
                      className={`${BUTTON_HOVER_EFFECTS.ghost} text-muted-foreground hover:text-[#1DA1F2]`}
                    >
                      <Twitter className={`h-5 w-5 ${ICON_HOVER_EFFECTS.default}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on Twitter</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSocialShare('linkedin')}
                      className={`${BUTTON_HOVER_EFFECTS.ghost} text-muted-foreground hover:text-[#0A66C2]`}
                    >
                      <Linkedin className={`h-5 w-5 ${ICON_HOVER_EFFECTS.default}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSocialShare('whatsapp')}
                      className={`${BUTTON_HOVER_EFFECTS.ghost} text-muted-foreground hover:text-[#25D366] px-3`}
                    >
                      <span className="text-lg mr-1">📱</span>
                      <span className="text-sm">WhatsApp</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share via WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Legal & Copyright */}
          <div className="lg:text-right space-y-4">
            <div className="flex flex-col lg:items-end space-y-3">
              <div className="flex flex-wrap gap-6 justify-center lg:justify-end">
                <Link 
                  to="/terms" 
                  className={`text-sm text-muted-foreground hover:text-primary ${BUTTON_HOVER_EFFECTS.link}`}
                >
                  Terms & Conditions
                </Link>
                <Link 
                  to="/privacy" 
                  className={`text-sm text-muted-foreground hover:text-primary ${BUTTON_HOVER_EFFECTS.link}`}
                >
                  Privacy Policy
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} EchoVault. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
