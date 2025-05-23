
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { CtaSection } from "@/components/home/CtaSection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
