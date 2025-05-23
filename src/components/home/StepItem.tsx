
interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

export function StepItem({ number, title, description }: StepItemProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center">
      <div className="md:w-1/4 flex justify-center mb-4 md:mb-0">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
          {number}
        </div>
      </div>
      <div className="md:w-3/4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
