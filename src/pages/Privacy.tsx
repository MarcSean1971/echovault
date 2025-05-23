
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            At EchoVault, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal 
            information when you use our digital message time capsule service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p>
            We collect the following types of information:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Account Information:</strong> When you register, we collect your name, email address, and password.</li>
            <li><strong>Message Content:</strong> We store the messages, attachments, and delivery conditions you create.</li>
            <li><strong>Recipient Information:</strong> We collect contact details for your message recipients.</li>
            <li><strong>Usage Data:</strong> We collect data about how you interact with our service.</li>
            <li><strong>Check-in Data:</strong> We record when you complete check-ins within the service.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>
            We use your information to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide and maintain our service</li>
            <li>Deliver your messages according to your specified conditions</li>
            <li>Send you service notifications and reminders</li>
            <li>Improve and optimize our service</li>
            <li>Detect and prevent fraudulent activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p>
            We implement robust security measures to protect your personal information. Your messages and attachments are 
            encrypted at rest, and we employ industry-standard protocols to maintain the security of our systems.
          </p>
          <p className="mt-4">
            Despite our efforts, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute 
            security of your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, 
            unless a longer retention period is required by law. Message content is stored until delivered according to your 
            specified conditions or until you delete it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p>
            Depending on your location, you may have rights regarding your personal data, including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Accessing your personal data</li>
            <li>Correcting inaccurate data</li>
            <li>Deleting your data</li>
            <li>Restricting or objecting to our processing of your data</li>
            <li>Data portability</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us using the information provided below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
          <p>
            We may use third-party services to help deliver our service. These third parties may have access to your 
            personal information only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@echovault.com
          </p>
        </section>
      </div>
    </div>
  );
}
