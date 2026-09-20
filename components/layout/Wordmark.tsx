import Image from "next/image";

import { hotel } from "@/lib/content";

/** Official Hotel Grauson wordmark. The source PNG is white; the ink layer is
 *  the same file with `brightness(0)`. The navbar crossfades between them. */
export function Wordmark({
  className = "",
  size = "md",
  priority = false,
  ink = false,
}: {
  className?: string;
  size?: "md" | "lg";
  priority?: boolean;
  /** Paper / solid nav: fade to the black wordmark. */
  ink?: boolean;
}) {
  const box =
    size === "lg"
      ? "h-[3.85rem] w-[9.1rem] sm:h-[4.6rem] sm:w-[10.85rem]"
      : "h-[2.85rem] w-[6.75rem] sm:h-[3.3rem] sm:w-[7.8rem]";

  return (
    <span className={`relative inline-block ${box} ${className}`}>
      <Image
        src="/images/logo-grauson.png"
        alt={hotel.name}
        width={387}
        height={164}
        priority={priority}
        unoptimized
        className={`absolute inset-0 size-full object-contain object-left transition-opacity duration-700 [transition-timing-function:var(--ease-skin)] [filter:drop-shadow(0_1px_14px_rgb(20_24_18_/_0.45))] ${
          ink ? "opacity-0" : "opacity-100"
        }`}
      />
      <Image
        src="/images/logo-grauson.png"
        alt=""
        width={387}
        height={164}
        priority={priority}
        unoptimized
        aria-hidden
        className={`absolute inset-0 size-full object-contain object-left transition-opacity duration-700 [transition-timing-function:var(--ease-skin)] [filter:brightness(0)] ${
          ink ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
