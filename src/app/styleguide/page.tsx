import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = { title: "Styleguide" };

// Living reference of the design tokens and components. Tokens are defined in src/app/globals.css.
const colors = [
  ["primary", "--ds-action-primary"],
  ["brand-subtle", "--ds-brand-subtle"],
  ["secondary", "--ds-action-secondary"],
  ["muted", "--ds-neutral-muted"],
  ["muted-foreground", "--ds-neutral-muted-foreground"],
  ["destructive", "--ds-action-destructive"],
  ["success", "--ds-status-success-solid"],
  ["warning", "--ds-status-warning-solid"],
  ["info", "--ds-status-info-solid"],
  ["background", "--ds-surface-background"],
  ["canvas", "--ds-surface-canvas"],
  ["foreground", "--ds-surface-foreground"],
  ["border", "--ds-interaction-border"],
  ["ring", "--ds-interaction-ring"],
  ["ai", "--ds-status-ai-solid"],
];

export default function StyleguidePage() {
  return (
    <div className="container-page space-y-16 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Styleguide</h1>
        <p className="text-muted-foreground">Colors come from the Oppizi Design System (<code>src/styles/oppizi-tokens.css</code>), mapped to shadcn in <code>src/app/globals.css</code>.</p>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {colors.map(([name, token]) => (
            <div key={name} className="space-y-1">
              <div className="h-16 rounded-xl border" style={{ background: `var(${token})` }} />
              <p className="text-sm font-medium">{name}</p>
              <p className="font-mono text-xs text-muted-foreground">{token}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold">Heading 1</h1>
          <h2 className="text-4xl font-bold">Heading 2</h2>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <p className="max-w-2xl text-lg">Body large. Reach every home in the neighborhoods you choose.</p>
          <p className="max-w-2xl">Body. Pick routes on a map, design your postcard, and we handle the rest.</p>
          <p className="text-sm text-muted-foreground">Small / muted text for captions and helper copy.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="lg">Large</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-md gap-4">
          <div className="space-y-2">
            <Label htmlFor="sg-name">Business name</Label>
            <Input id="sg-name" placeholder="Joe's Pizza" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-msg">Message</Label>
            <Textarea id="sg-msg" placeholder="Tell us about your campaign" />
          </div>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description text.</CardDescription>
          </CardHeader>
          <CardContent>Card content goes here.</CardContent>
        </Card>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="border-b pb-2 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
