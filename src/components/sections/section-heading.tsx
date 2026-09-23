import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl space-y-3 text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wider text-brand uppercase">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {body && <p className="text-lg text-muted-foreground">{body}</p>}
    </div>
  );
}
