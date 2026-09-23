import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";
import { Features } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Pricing } from "@/components/sections/pricing";
import { TrustRow } from "@/components/sections/trust-row";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustRow />
      <HowItWorks />
      <Features />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
