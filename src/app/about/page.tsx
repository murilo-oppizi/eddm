import type { Metadata } from "next";

import {
  AboutHero,
  AboutLife,
  AboutMission,
  AboutResults,
  AboutStory,
  AboutTeam,
  AboutValues,
  AboutWorld,
} from "@/components/sections/about";
import { Cta } from "@/components/sections/cta";
import { TrustRow } from "@/components/sections/trust-row";
import { about } from "@/content/site";

export const metadata: Metadata = { title: "About", description: about.description };

// Who's behind EDDM: Oppizi's line and postmark, the clients and numbers, the story as a
// mail route, the mission, the four beliefs, where it works, the people, results,
// careers, then the same closing card as the homepage.
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <TrustRow />
      <AboutResults />
      <AboutStory />
      <AboutMission />
      <AboutValues />
      <AboutWorld />
      <AboutTeam />
      <AboutLife />
      <Cta />
    </>
  );
}
