"use client";

import { useEffect, useRef, useState } from "react";
import { IconCircleCheck, IconSend } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contact } from "@/content/site";
import { cn } from "@/lib/utils";

// Front-end only: nothing is sent yet. Backend devs will post the form data in onSubmit
// (and handle errors); for now a valid form shows the success state, so it can be designed.
export function ContactForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  // The thank-you is much shorter than the form, so on phones it would land above the
  // screen: bring it into view, and move focus to it for keyboard and screen reader users.
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sentTo === null) return;
    status.current?.scrollIntoView({ block: "center" });
    status.current?.focus({ preventScroll: true });
  }, [sentTo]);

  if (sentTo !== null) {
    return (
      <div
        ref={status}
        role="status"
        tabIndex={-1}
        className="flex flex-col items-center gap-4 py-10 text-center outline-none"
      >
        <span className="grid size-12 place-items-center rounded-full bg-success-subtle text-success">
          <IconCircleCheck className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{contact.success.title.replace("{name}", sentTo)}</h2>
          <p className="text-muted-foreground">{contact.success.body}</p>
        </div>
        <Button variant="outline" size="lg" onClick={() => setSentTo(null)}>
          {contact.success.again}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSentTo(String(new FormData(e.currentTarget).get("firstName") ?? "").trim());
      }}
    >
      <Field id="firstName" label="First name" autoComplete="given-name" required />
      <Field id="lastName" label="Last name" autoComplete="family-name" required />
      <Field id="email" label="Work email" type="email" autoComplete="email" required className="sm:col-span-2" />
      <Field id="company" label="Business name" autoComplete="organization" />
      <Field id="area" label="Where do you want to mail?" placeholder="ZIP code or neighborhood" />

      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-medium">
          {contact.reach.legend} <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2 pt-1">
          {contact.reach.options.map((option) => (
            <label key={option} className="cursor-pointer">
              <input type="radio" name="homes" value={option} className="peer sr-only" />
              <span className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm transition-colors peer-checked:border-primary peer-checked:bg-brand-subtle peer-checked:text-brand-subtle-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted">
                {option}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="message">
          Message <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="message" name="message" rows={4} placeholder="Tell us about your business and what you'd like to promote." />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" size="xl" className="w-full sm:w-auto">
          <IconSend data-icon="inline-start" /> Send message
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required = false,
  className,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {!required && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input id={id} name={id} required={required} className="h-11" {...props} />
    </div>
  );
}
