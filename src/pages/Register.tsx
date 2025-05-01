
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/layout/navbar/Logo";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Register() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // If already signed in, redirect to dashboard
  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <p className="mt-2 text-muted-foreground">Your secure digital failsafe</p>
        </div>
        
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
