
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreateMessageForm } from "@/components/message/CreateMessageForm";
import { TriggerDashboard } from "@/components/message/TriggerDashboard";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreateMessage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Message Management</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create New Message</TabsTrigger>
          <TabsTrigger value="dashboard">Trigger Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <CreateMessageForm onCancel={() => navigate("/dashboard")} />
        </TabsContent>
        
        <TabsContent value="dashboard">
          <TriggerDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
