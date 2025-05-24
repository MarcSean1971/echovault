
import { LucideIcon } from "lucide-react";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface SocialIconProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function SocialIcon({ href, icon: Icon, label }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`
        inline-flex items-center justify-center 
        w-10 h-10 rounded-full 
        bg-muted/50 text-muted-foreground
        hover:bg-gradient-to-r hover:from-primary hover:to-accent 
        hover:text-white
        ${ICON_HOVER_EFFECTS.default}
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}
