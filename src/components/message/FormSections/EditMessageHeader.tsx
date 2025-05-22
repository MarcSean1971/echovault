
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface EditMessageHeaderProps {
  onCancel: () => void;
}

export function EditMessageHeader({ onCancel }: EditMessageHeaderProps) {
  return (
    <CardHeader className="bg-purple-50 border-b border-purple-100">
      <CardTitle className={`text-2xl font-semibold text-purple-900 ${HOVER_TRANSITION}`}>
        Edit Message
      </CardTitle>
    </CardHeader>
  );
}
