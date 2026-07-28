'use client';

import { faqItems } from '@/lib/camp-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FaqContent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <Accordion type="single" collapsible className="space-y-3">
        {faqItems.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border/60 bg-card/50 px-6 transition-colors hover:border-primary/30">
            <AccordionTrigger className="text-left font-display text-base font-bold text-white hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
