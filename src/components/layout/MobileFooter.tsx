
import { HeaderButtons } from "./navbar/header-buttons";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";

export function MobileFooter() {
  const isMobile = useIsMobile();
  const { conditions, lastRefresh } = useTriggerDashboard();
  
  // Only render on mobile
  if (!isMobile) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-[0_-1px_2px_rgba(0,0,0,0.1)] border-t py-2 z-30">
      <div className="container mx-auto px-4">
        <HeaderButtons 
          conditions={conditions} 
          userId={null} 
        />
      </div>
    </div>
  );
}
