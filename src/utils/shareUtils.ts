
import { toast } from "@/hooks/use-toast";

/**
 * Share EchoVault with a promotional message
 */
export async function shareEchoVault(): Promise<void> {
  const shareData = {
    title: "EchoVault - Secure Digital Inheritance",
    text: "Discover EchoVault - the secure platform for digital inheritance and message delivery. Protect your digital legacy and ensure your important messages reach loved ones when it matters most.",
    url: "https://echo-vault.app"
  };

  try {
    // Check if Web Share API is available (primarily mobile)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      toast({
        title: "Thanks for sharing!",
        description: "EchoVault has been shared successfully.",
        duration: 3000,
      });
    } else {
      // Fallback to clipboard copy
      const shareText = `${shareData.text}\n\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "The EchoVault message has been copied. You can now paste it anywhere to share.",
        duration: 4000,
      });
    }
  } catch (error) {
    // Handle errors gracefully
    console.error("Share failed:", error);
    toast({
      title: "Share unavailable",
      description: "Unable to share at this time. You can visit https://echo-vault.app to learn more about EchoVault.",
      variant: "destructive",
      duration: 5000,
    });
  }
}
