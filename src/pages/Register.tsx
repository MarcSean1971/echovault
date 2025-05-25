
import { useNavigate } from "react-router-dom";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Register() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already signed in, redirect to messages
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsRedirecting(true);
      navigate("/messages");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // If we're still checking auth or redirecting, show a loading state
  if (!isLoaded || isRedirecting) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Create your EchoVault account to get started
            </CardDescription>
          </CardHeader>
          
          <RegistrationForm />
        </Card>
      </div>
    </div>
  );
}
