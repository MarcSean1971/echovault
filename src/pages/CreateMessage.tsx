
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreateMessageForm } from "@/components/message/CreateMessageForm";

export default function CreateMessage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Message</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <CreateMessageForm onCancel={() => navigate("/dashboard")} />
    </div>
  );
}
