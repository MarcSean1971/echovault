
import { Link } from "react-router-dom";
import { BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

export function LegalLinks() {
  return (
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
  );
}
