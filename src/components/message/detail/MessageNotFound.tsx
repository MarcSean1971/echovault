
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MessageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Message not found</h1>
        <Button onClick={() => navigate("/messages")}>
          Back to Messages
        </Button>
      </div>
    </div>
  );
}
