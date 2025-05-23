
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, FileCheck, Lock, MessageSquare, Shield, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-12">
            <div className="md:w-1/2 mb-10 md:mb-0 space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your <span className="gradient-text">Legacy</span>, <br />
                Under Your <span className="gradient-text">Control</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-md">
                Send messages to loved ones, even when you can't be there.
                EchoVault ensures your legacy lives on your terms.
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

      {/* Features Section */}
      <section className="py-16 bg-secondary/30" id="features">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose EchoVault?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide a secure platform to share your most important messages with future generations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow animate-fade-in stagger-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">End-to-End Encryption</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your sensitive information is fully encrypted and only accessible to your chosen recipients.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow animate-fade-in stagger-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Scheduled Delivery</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set up messages to be delivered on specific dates or triggered by missed check-ins.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow animate-fade-in stagger-3">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multiple Content Types</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Store text, voice messages, videos, and files securely for future delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple steps to ensure your messages reach the right people at the right time.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  1
                </div>
              </div>
              <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2">Create Your Messages</h3>
                <p className="text-muted-foreground">
                  Write messages, upload images, documents, or record audio and video for your loved ones.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  2
                </div>
              </div>
              <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2">Set Delivery Conditions</h3>
                <p className="text-muted-foreground">
                  Choose when and how your messages will be delivered — by date or triggered by missed check-ins.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  3
                </div>
              </div>
              <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2">Add Recipients</h3>
                <p className="text-muted-foreground">
                  Select who should receive each message and how they'll be notified.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  4
                </div>
              </div>
              <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2">Regular Check-ins</h3>
                <p className="text-muted-foreground">
                  Confirm your status regularly to prevent premature message delivery.
                </p>
              </div>
            </div>
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

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className="bg-muted/40 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-serif font-bold gradient-text">EchoVault</h2>
              <p className="text-sm text-muted-foreground">Your secure digital failsafe</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} EchoVault. All rights reserved.
              </p>
              <div className="flex space-x-4 mt-2">
                <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
                <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
