import Image from "next/image";

import { hotel } from "@/lib/content";

/** Official Hotel Grauson wordmark. The source PNG is white; pass a `filter` with
 *  `brightness(0)` to ink it on paper — the navbar crossfades between the two. */
export function Wordmark({
  className = "",
  size = "md",
  priority = false,
}: {
  className?: string;
  size?: "md" | "lg";
  priority?: boolean;
}) {
  const box =
    size === "lg"
      ? "h-[3.85rem] w-[9.1rem] sm:h-[4.6rem] sm:w-[10.85rem]"
      : "h-[2.85rem] w-[6.75rem] sm:h-[3.3rem] sm:w-[7.8rem]";

  return (
    <Image
      src="/images/logo-grauson.png"
      alt={hotel.name}
      width={387}
      height={164}
      priority={priority}
      unoptimized
      className={`object-contain object-left transition-[filter,opacity] duration-700 [transition-timing-function:var(--ease-skin)] ${box} ${className}`}
    />
  );
}
