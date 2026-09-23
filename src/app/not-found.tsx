import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any URL that doesn't exist, inside the site's header and footer.
export default function NotFound() {
  return (
    <section className="py-28">
      <div className="container-page space-y-8">
        <SectionHeading
          level={1}
          eyebrow="404 · Page not found"
          title="Return to sender"
          body="We couldn't find the page you were looking for. It may have moved, or the link may have a typo."
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="xl" nativeButton={false} render={<Link href="/" />}>
            Back to home
          </Button>
          <Button size="xl" variant="outline" nativeButton={false} render={<Link href="/contact" />}>
            Contact us <IconArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  );
}
