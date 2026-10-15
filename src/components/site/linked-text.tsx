import { cn } from "@/lib/utils";

/** One phrase in a piece of copy that links somewhere: the words, and where they go. */
export type Linked = { text: string; href: string };

/**
 * Copy with one phrase linked: the first place `link.text` appears becomes a link to
 * `link.href`. Without a link, or if the phrase isn't there, it's just the text.
 */
export function LinkedText({ text, link, className }: { text: string; link?: Linked; className?: string }) {
  const at = link ? text.indexOf(link.text) : -1;
  if (!link || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <a
        href={link.href}
        className={cn(
          "font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-brand hover:decoration-current",
          className
        )}
      >
        {link.text}
      </a>
      {text.slice(at + link.text.length)}
    </>
  );
}
