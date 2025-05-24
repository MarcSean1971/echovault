
import { Link } from "react-router-dom";
import { BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-muted/30 to-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-serif font-bold gradient-text mb-2">EchoVault</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your secure digital failsafe. Ensuring your important messages reach the right people at the right time.
              </p>
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
