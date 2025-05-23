
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-muted/40 py-8">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-serif font-bold gradient-text">EchoVault</h2>
            <p className="text-sm text-muted-foreground">Your secure digital failsafe</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
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
