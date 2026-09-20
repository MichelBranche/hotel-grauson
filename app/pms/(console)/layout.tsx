import { PmsConsoleLayout } from "@pms-core/app/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PmsConsoleLayout>{children}</PmsConsoleLayout>;
}
