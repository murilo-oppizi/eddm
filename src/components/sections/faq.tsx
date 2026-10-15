import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/sections/section-heading";
import { faqs } from "@/content/site";

/** An answer, with its one linked phrase (if it has one) as a link. */
function Answer({ a, link }: (typeof faqs)[number]) {
  const at = link ? a.indexOf(link.text) : -1;
  if (!link || at < 0) return <>{a}</>;
  return (
    <>
      {a.slice(0, at)}
      <a href={link.href} className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
        {link.text}
      </a>
      {a.slice(at + link.text.length)}
    </>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="container-page max-w-3xl space-y-12">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          body="Everything you need to know before your first campaign."
        />
        <Accordion>
          {faqs.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="py-4 text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                <Answer {...item} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
