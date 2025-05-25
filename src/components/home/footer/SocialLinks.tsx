
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { SocialIcon } from "./SocialIcon";

const socialLinks = [
  {
    href: "https://facebook.com/echovault",
    icon: Facebook,
    label: "Follow EchoVault on Facebook"
  },
  {
    href: "https://twitter.com/echovault",
    icon: Twitter,
    label: "Follow EchoVault on Twitter"
  },
  {
    href: "https://linkedin.com/company/echovault",
    icon: Linkedin,
    label: "Follow EchoVault on LinkedIn"
  },
  {
    href: "https://instagram.com/echovault",
    icon: Instagram,
    label: "Follow EchoVault on Instagram"
  },
  {
    href: "https://youtube.com/@echovault",
    icon: Youtube,
    label: "Subscribe to EchoVault on YouTube"
  }
];

export function SocialLinks() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-sm font-medium text-foreground">
        Connect with EchoVault
      </h3>
      <div className="flex items-center space-x-4">
        {socialLinks.map((social) => (
          <SocialIcon
            key={social.label}
            href={social.href}
            icon={social.icon}
            label={social.label}
          />
        ))}
      </div>
    </div>
  );
}
