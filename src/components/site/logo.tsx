import Link from "next/link";
import { MailIcon } from "lucide-react";

import { site } from "@/content/site";

// Placeholder mark until a real logo exists — swap the icon for an <Image /> or inline SVG.
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground">
        <MailIcon className="size-4" />
      </span>
      {site.name}
    </Link>
  );
}
