
import { LegalLinks } from "./footer/LegalLinks";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-muted/30 to-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="flex justify-center">
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
