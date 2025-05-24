
import { LegalLinks } from "./footer/LegalLinks";
import { SocialLinks } from "./footer/SocialLinks";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-muted/30 to-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="flex flex-col items-center space-y-8">
          {/* Social Media Section */}
          <SocialLinks />
          
          {/* Divider */}
          <div className="w-full max-w-md mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>
          
          {/* Legal Links Section */}
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
