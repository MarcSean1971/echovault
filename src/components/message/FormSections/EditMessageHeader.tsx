
import { CardHeader, CardTitle } from "@/components/ui/card";

interface EditMessageHeaderProps {
  onCancel: () => void;
}

export function EditMessageHeader({ onCancel }: EditMessageHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>Edit Message</CardTitle>
    </CardHeader>
  );
}
