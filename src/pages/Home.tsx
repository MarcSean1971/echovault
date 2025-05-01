
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Clock, FileCheck, Lock, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">EchoVault</h1>
        <p className="text-xl text-muted-foreground">
          Your secure digital failsafe for peace of mind
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Create Account</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="mb-2">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>End-to-End Encryption</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your sensitive information is fully encrypted and only accessible to your chosen recipients.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Scheduled Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Set up messages to be delivered on specific dates or triggered by missed check-ins.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Multiple Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Store text, voice messages, videos, and files securely for future delivery.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Peace of Mind</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Rest assured your important messages will reach the right people when needed.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="max-w-2xl mx-auto text-left">
          <ol className="list-decimal pl-6 space-y-2">
            <li>Create and securely store your messages, files, and media</li>
            <li>Set up delivery triggers (check-ins, date-based, or emergency)</li>
            <li>Add trusted contacts who will receive your content</li>
            <li>Regularly check-in to confirm your status</li>
            <li>If triggers activate, your content is securely delivered</li>
          </ol>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <Button size="lg" asChild>
          <Link to="/register">Create Your Secure Vault</Link>
        </Button>
      </div>
    </div>
  );
}
