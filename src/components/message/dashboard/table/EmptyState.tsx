
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <div className="py-4 text-center">
      <p className="text-muted-foreground">No message triggers set up yet</p>
      <Button 
        variant="outline" 
        className="mt-2"
        onClick={() => navigate("/create-message")}
      >
        Create Your First Message
      </Button>
    </div>
  );
}
