
import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link 
      to="/" 
      className="font-serif font-bold text-2xl mr-6 relative group flex items-center"
    >
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        EchoVault
      </span>
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
    </Link>
  );
}
