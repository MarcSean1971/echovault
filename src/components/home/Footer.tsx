
import { CompanyInfo } from "./footer/CompanyInfo";
import { LegalLinks } from "./footer/LegalLinks";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-muted/30 to-muted/50 border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <CompanyInfo />
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
