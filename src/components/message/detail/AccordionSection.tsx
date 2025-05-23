
import { useState } from "react";
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
  // Simplify state management - just track open/closed state
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Accordion 
      type="single" 
      collapsible 
      value={isOpen ? value : ""} 
      onValueChange={(newValue) => setIsOpen(newValue === value)}
      className={className}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger 
          className={`py-3 px-2 rounded text-sm font-medium text-muted-foreground hover:bg-muted/50 ${HOVER_TRANSITION} w-full flex justify-between`}
        >
          {title}
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
