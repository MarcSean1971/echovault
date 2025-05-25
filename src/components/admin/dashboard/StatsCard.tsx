
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { useHoverEffects } from "@/hooks/useHoverEffects";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

export function StatsCard({ title, value, description, icon, onClick, clickable = false }: StatsCardProps) {
  const { getButtonHoverClasses } = useHoverEffects();

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-1 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {clickable && (
          <p className="text-xs text-primary mt-1 font-medium">Click to view all →</p>
        )}
      </CardContent>
    </>
  );

  if (clickable && onClick) {
    return (
      <Card 
        className={`cursor-pointer select-none ${getButtonHoverClasses('ghost')} min-h-[44px] touch-manipulation`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`View all ${title.toLowerCase()}`}
      >
        {cardContent}
      </Card>
    );
  }

  return <Card>{cardContent}</Card>;
}
