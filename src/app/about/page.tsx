import type { Metadata } from "next";

import {
  AboutHero,
  AboutLife,
  AboutMission,
  AboutTeam,
  AboutValues,
  AboutWorld,
} from "@/components/sections/about";
import { about } from "@/content/site";

export const metadata: Metadata = { title: "About", description: about.description };

// Who's behind EDDM: Oppizi's line and postmark, the
// mission, the four beliefs, where it works, the people, and careers. The clients,
// numbers and closing card are the homepage's; they aren't repeated here.
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutMission />
      <AboutValues />
      <AboutWorld />
      <AboutTeam />
      <AboutLife />
    </>
  );
}
