
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReactNode } from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AccordionSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  value?: string;
}

export function AccordionSection({ 
  title, 
  children, 
  defaultOpen = false, 
  className = "",
  value = "item-1"
}: AccordionSectionProps) {
  return (
    <Accordion 
      type="single" 
      collapsible 
      defaultValue={defaultOpen ? value : undefined} 
      className={className}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className={`py-2 text-sm font-medium text-muted-foreground ${HOVER_TRANSITION}`}>
          {title}
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-2">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
