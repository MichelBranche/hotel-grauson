import type { Metadata } from "next";

import { PmsRootLayout } from "@pms-core/app/layout";

export const metadata: Metadata = {
  title: "PMS",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PmsRootLayout>{children}</PmsRootLayout>;
}
