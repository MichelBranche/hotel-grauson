import { Hero } from "@/components/hero/Hero";
import { PageShell } from "@/components/layout/PageShell";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { StorySection } from "@/components/sections/StorySection";

/* The page is otherwise fully static, so without this the season would stay
   frozen at whatever it was on the day of the build. */
export const revalidate = 3600;

export default function Home() {
  return (
    <PageShell footerPull>
      <Hero />
      <FeatureCards />
      <StorySection />
      <AvailabilityBar />
    </PageShell>
  );
}
