
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

export function MessageLoader() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg p-8 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-lg font-medium">Loading secure message...</p>
      </Card>
    </div>
  );
}
