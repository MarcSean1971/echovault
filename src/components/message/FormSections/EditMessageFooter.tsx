
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface EditMessageFooterProps {
  onCancel: () => void;
  isLoading: boolean;
  isFormValid: boolean;
}

export function EditMessageFooter({ onCancel, isLoading, isFormValid }: EditMessageFooterProps) {
  return (
    <CardFooter className="flex justify-between">
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </CardFooter>
  );
}
