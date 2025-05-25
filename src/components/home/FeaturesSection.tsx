
import { Lock, Clock, FileCheck, AlertCircle } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  const features = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Your sensitive information is fully encrypted and only accessible to your chosen recipients."
    },
    {
      icon: Clock,
      title: "Scheduled Delivery",
      description: "Set up messages to be delivered on specific dates or triggered by missed check-ins."
    },
    {
      icon: FileCheck,
      title: "Multiple Content Types",
      description: "Store text, voice messages, videos, and files securely for future delivery."
    },
    {
      icon: AlertCircle,
      title: "Emergency Panic Button",
      description: "Instantly alert your emergency contacts with your location during crisis situations."
    }
  ];

  return (
    <section className="py-16 bg-secondary/30" id="features">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose EchoVault?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We provide a secure platform to share your most important messages with future generations and ensure help reaches you in emergencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
