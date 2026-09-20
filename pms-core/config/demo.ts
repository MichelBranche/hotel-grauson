/** Edge-safe demo defaults. Do not import Node filesystem APIs here. */

export const DEMO_AUTH_SECRET = "grauson-pms-demo-secret-not-for-production";

export const DEMO_LOGIN = {
  email: "michel.branche@grauson.local",
  password: "Grauson2026!",
} as const;

export function getAuthSecret() {
  return process.env["AUTH_SECRET"] || DEMO_AUTH_SECRET;
}

export function isDemoRuntime() {
  return Boolean(process.env.VERCEL) || process.env.PMS_DEMO_MODE === "1";
}
