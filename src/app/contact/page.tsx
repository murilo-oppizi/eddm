import type { Metadata } from "next";
import Link from "next/link";
import { IconHelpCircle, IconLogin2, IconMail, IconMapPin, type TablerIcon } from "@tabler/icons-react";

import { ContactForm } from "@/components/site/contact-form";
import { SectionHeading } from "@/components/sections/section-heading";
import { contact } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: contact.description };

const icons: Record<(typeof contact.channels)[number]["icon"], TablerIcon> = {
  mail: IconMail,
  login: IconLogin2,
  help: IconHelpCircle,
};

export default function ContactPage() {
  return (
    <section className="py-20">
      <div className="container-page space-y-12">
        <SectionHeading level={1} eyebrow={contact.eyebrow} title={contact.title} body={contact.body} />

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <ContactForm />
          </div>

          {/* Other ways to reach us */}
          <aside aria-label="Other ways to reach us" className="space-y-4">
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
              {contact.channels.map((channel) => {
                const Icon = icons[channel.icon];
                return (
                  <li key={channel.title}>
                    <Link href={channel.href} className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/60">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-muted-foreground">{channel.title}</span>
                        <span className="block truncate font-medium">{channel.value}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-4 rounded-2xl border bg-card p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <IconMapPin className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{contact.office.title}</p>
                <address className="font-medium not-italic">
                  {contact.office.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
