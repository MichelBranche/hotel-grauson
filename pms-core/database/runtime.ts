import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

import { isDemoRuntime } from "@pms-core/config/demo";

const BUNDLED_RELATIVE = path.join("pms-core", "prisma", "demo.db");

function bundledDemoDbPath() {
  const candidates = [
    path.join(process.cwd(), BUNDLED_RELATIVE),
    path.join(process.cwd(), "prisma", "demo.db"),
    path.resolve(BUNDLED_RELATIVE),
  ];
  return candidates.find((file) => existsSync(file));
}

function writableDemoDbPath() {
  if (process.env.VERCEL || process.platform !== "win32") {
    return path.join("/tmp", "pms-demo.db");
  }
  return path.join(process.cwd(), ".next", "cache", "pms-demo.db");
}

function shouldUseBundledSqlite(url: string | undefined) {
  if (!isDemoRuntime()) return false;
  return !url || url.startsWith("file:");
}

export function resolveDatabaseUrl() {
  const configured = process.env["DATABASE_URL"];
  if (!shouldUseBundledSqlite(configured)) {
    return configured ?? "file:./dev.db";
  }

  const dest = writableDemoDbPath();
  if (!existsSync(dest)) {
    const source = bundledDemoDbPath();
    if (!source) {
      throw new Error("Database demo mancante nel deploy. Includi pms-core/prisma/demo.db nel bundle.");
    }
    copyFileSync(source, dest);
  }

  const url = dest.includes("\\") ? `file:${dest.replaceAll("\\", "/")}` : `file:${dest}`;
  process.env.DATABASE_URL = url;
  return url;
}
