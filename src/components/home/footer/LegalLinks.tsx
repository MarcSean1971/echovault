
import { Link } from "react-router-dom";
import { BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

export function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-center">
      <Link 
        to="/terms" 
        className={`text-sm text-muted-foreground hover:text-primary ${BUTTON_HOVER_EFFECTS.link}`}
      >
        Terms & Conditions
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link 
        to="/privacy" 
        className={`text-sm text-muted-foreground hover:text-primary ${BUTTON_HOVER_EFFECTS.link}`}
      >
        Privacy Policy
      </Link>
      <span className="text-muted-foreground">|</span>
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EchoVault. All rights reserved.
      </p>
    </div>
  );
}
