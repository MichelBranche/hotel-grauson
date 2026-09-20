import { ForestParallax } from "@/components/layout/ForestParallax";
import { SeasonalImage } from "@/components/ui/SeasonalImage";

/**
 * Alpine horizon: the page dissolving into the valley.
 *
 * The artwork is anchored to the bottom of the band and drifts slightly as the
 * footer enters the viewport. Gradients at both edges melt it into the warm
 * paper above and the dark footer below, so the band has no visible seams.
 */
export function AlpineForest() {
  return (
    <ForestParallax className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden bg-paper">
      {/* Overhanging the artwork on narrow screens keeps the panorama — and so
          the sense of depth — readable instead of cropping to a few trees. */}
      <div
        data-forest-speed={3}
        className="absolute bottom-0 -left-[22%] h-[108%] w-[144%] sm:left-0 sm:w-full"
      >
        <SeasonalImage
          slot="footer"
          sizes="100vw"
          unoptimized
          className="object-cover object-bottom"
        />
      </div>

      {/* Melts the pale sky into the page above. Kept short: the artwork's own
          sky is already within a few values of --paper, so a deep veil would
          only bleach the ridges the crop is meant to show. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[12%] bg-[linear-gradient(to_bottom,var(--paper)_0%,rgb(241_238_230_/_0.62)_42%,transparent_100%)]"
      />

      {/* Roots the dark foreground into the footer below. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[18%] bg-[linear-gradient(to_top,var(--alpine-deep)_0%,rgb(27_36_29_/_0.78)_34%,rgb(27_36_29_/_0.26)_72%,transparent_100%)]"
      />
    </ForestParallax>
  );
}
