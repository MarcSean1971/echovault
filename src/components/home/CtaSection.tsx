
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-br from-primary/20 to-accent/20 py-16">
      <div className="container px-4 mx-auto text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Peace of Mind for Your Digital Legacy</h2>
          <p className="text-lg mb-8">
            Join thousands who trust EchoVault to deliver their most important messages.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
            <Link to="/register">Get Started Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
