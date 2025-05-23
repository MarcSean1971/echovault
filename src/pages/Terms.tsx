
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4 hover:bg-accent hover:text-accent-foreground active:translate-y-0.5">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to EchoVault ("we", "our", "us"). By using our service, you agree to these Terms and Conditions, 
            which constitute a legally binding agreement between you and EchoVault. Please read these terms carefully.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Scope of Services</h2>
          <p>
            EchoVault provides a digital message time capsule service that allows users to create, store, and schedule 
            delivery of digital messages and files to specified recipients under conditions set by the user.
          </p>
          <p className="mt-4">
            Our services include but are not limited to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Storage of user-created messages and attached files</li>
            <li>Scheduled or condition-based delivery of those messages</li>
            <li>Regular check-in functionality to confirm user status</li>
            <li>Management of recipients and delivery preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            To use EchoVault, you must create an account. You are responsible for maintaining the confidentiality of your 
            account information and for all activities that occur under your account. You agree to notify us immediately of 
            any unauthorized use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p>
            You retain all ownership rights to the content you submit to EchoVault. However, by submitting content, 
            you grant us a worldwide, non-exclusive, royalty-free license to use, store, and deliver your content in 
            accordance with your instructions and our Privacy Policy.
          </p>
          <p className="mt-4">
            You agree not to submit content that is illegal, offensive, or violates the rights of others. We reserve the right 
            to remove any content that violates these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Service Reliability</h2>
          <p>
            While we strive to ensure the reliable delivery of your messages according to your specified conditions, we cannot 
            guarantee 100% reliability due to factors outside our control. By using our service, you acknowledge this limitation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
          <p>
            We may terminate or suspend your account at any time if you violate these terms. You may terminate your account at any time, 
            but note that certain content may still be delivered according to your previously specified conditions unless you explicitly 
            cancel those deliveries.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify you of significant changes by posting them on our website 
            or sending you an email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at support@echovault.com
          </p>
        </section>
      </div>
    </div>
  );
}
