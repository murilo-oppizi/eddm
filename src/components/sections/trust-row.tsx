import Image from "next/image";

import { trust } from "@/content/site";
import { cn } from "@/lib/utils";

/** Logos are drawn at this share of their SVG's natural size — their viewBoxes are already balanced against each other.
 *  Shown at full strength (their near-black #121527 matches the stats below); hover dims them slightly. */
const LOGO_SCALE = 0.72;

export function TrustRow() {
  return (
    <section aria-label="Our clients" className="border-t py-12">
      <div className="container-page space-y-10">
        <p className="text-center text-sm font-medium text-muted-foreground">{trust.label}</p>

        {/* Endless logo strip: fades out at both edges, pauses on hover, and becomes a
            static wrapped row for visitors who prefer reduced motion. */}
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
            <LogoList />
            {/* Second copy makes the loop seamless; hidden from assistive tech and when static. */}
            <LogoList aria-hidden className="motion-reduce:hidden" />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-y-8 border-t pt-10 md:grid-cols-4 md:divide-x">
          {trust.stats.map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                {stat.value}
              </dd>
              <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function LogoList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "flex shrink-0 items-center gap-14 pr-14 motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0 sm:gap-20 sm:pr-20 sm:motion-reduce:pr-0",
        className
      )}
      {...props}
    >
      {trust.clients.map((client) => (
        <li key={client.name} className="shrink-0">
          <Image
            src={client.src}
            alt={props["aria-hidden"] ? "" : client.name}
            width={client.width}
            height={client.height}
            unoptimized
            // Tiny SVGs that slide in from off-screen; lazy loading would make them pop in.
            loading="eager"
            className="transition-opacity duration-300 hover:opacity-70"
            style={{ width: client.width * LOGO_SCALE, height: "auto" }}
          />
        </li>
      ))}
    </ul>
  );
}
