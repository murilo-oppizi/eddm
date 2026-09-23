import { SectionHeading } from "@/components/sections/section-heading";
import { steps } from "@/content/site";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow="How it works"
          title="From map to mailbox in three steps"
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border bg-card p-6">
              <span className="grid size-10 place-items-center rounded-full bg-brand-subtle font-heading font-bold text-brand-subtle-foreground">
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
