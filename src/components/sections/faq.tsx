import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/sections/section-heading";
import { faqs } from "@/content/site";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="container-page max-w-3xl space-y-12">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          body="Everything you need to know before your first campaign."
        />
        <Accordion>
          {faqs.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="py-4 text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
