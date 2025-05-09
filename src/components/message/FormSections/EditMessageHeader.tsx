
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface EditMessageHeaderProps {
  onCancel: () => void;
}

export function EditMessageHeader() {
  return (
    <CardHeader>
      <CardTitle>Edit Message</CardTitle>
    </CardHeader>
  );
}
