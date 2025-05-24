
import { Link } from "react-router-dom";

interface LogoProps {
  isPublicView?: boolean;
}

export function Logo({ isPublicView = false }: LogoProps) {
  const logoClasses = isPublicView 
    ? "font-serif font-bold text-2xl mr-6 relative group flex items-center"
    : "font-serif font-bold text-2xl mr-6 relative group flex items-center";
    
  const textClasses = isPublicView
    ? "text-[#9b87f5]" // Direct purple color for public view
    : "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent";
    
  const underlineClasses = isPublicView
    ? "absolute -bottom-1 left-0 w-0 h-0.5 bg-[#9b87f5] group-hover:w-full transition-all duration-300"
    : "absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300";

  return (
    <Link 
      to="/" 
      className={logoClasses}
    >
      <span className={textClasses}>
        EchoVault
      </span>
      <span className={underlineClasses}></span>
    </Link>
  );
}
