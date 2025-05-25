
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { StepItem } from "./StepItem";

export function HowItWorksSection() {
  const steps = [
    {
      title: "Create Your Messages",
      description: "Write messages, upload images, documents, or record audio and video for your loved ones."
    },
    {
      title: "Set Delivery Conditions",
      description: "Choose when and how your messages will be delivered — by date or triggered by missed check-ins."
    },
    {
      title: "Add Recipients",
      description: "Select who should receive each message and how they'll be notified."
    },
    {
      title: "Regular Check-ins",
      description: "Confirm your status regularly to prevent premature message delivery."
    },
    {
      title: "Emergency Response",
      description: "Access instant panic button for emergencies that immediately alerts your contacts with location."
    }
  ];

  return (
    <section className="py-16">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple steps to ensure your messages reach the right people at the right time, plus emergency protection when you need it most.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <StepItem 
              key={index}
              number={index + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
            <Link to="/register" className="inline-flex items-center">
              Create Your Secure Vault <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
