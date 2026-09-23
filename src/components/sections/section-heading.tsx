import { cn } from "@/lib/utils";

/** `level={1}`: the page's own title (About, Contact…), a size up from section titles. */
export function SectionHeading({
  eyebrow,
  title,
  body,
  level = 2,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  level?: 1 | 2;
  className?: string;
}) {
  const Title = level === 1 ? "h1" : "h2";
  return (
    <div className={cn("mx-auto max-w-2xl space-y-3 text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wider text-brand uppercase">{eyebrow}</p>
      )}
      <Title className={cn("font-bold", level === 1 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>
        {title}
      </Title>
      {body && <p className="text-lg text-muted-foreground">{body}</p>}
    </div>
  );
}
