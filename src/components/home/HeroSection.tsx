
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, FileCheck, MessageSquare, AlertCircle } from "lucide-react";

export function HeroSection() {
  return (
    <section className="hero-gradient py-16 md:py-24">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-12">
          <div className="md:w-1/2 mb-10 md:mb-0 space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Your <span className="gradient-text">Legacy</span>, <br />
              Under Your <span className="gradient-text">Control</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md">
              Send messages to loved ones and ensure help reaches you in emergencies, 
              even when you can't be there. EchoVault ensures your legacy lives on your terms.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
          
          <div className="md:w-1/2 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h3 className="font-medium">Message to Sarah</h3>
                      <p className="text-sm text-muted-foreground">Scheduled for daughter's graduation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileCheck className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h3 className="font-medium">Important Documents</h3>
                      <p className="text-sm text-muted-foreground">For family access</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 mt-1 text-red-500" />
                    <div>
                      <h3 className="font-medium">Emergency Alert</h3>
                      <p className="text-sm text-muted-foreground">Ready for activation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h3 className="font-medium">Check-in Status</h3>
                      <p className="text-sm text-muted-foreground">Last verified: Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
