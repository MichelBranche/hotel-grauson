/** Session signing. AUTH_SECRET must be set in the environment. */

const AUTH_SECRET_PLACEHOLDER = "replace-with-a-long-random-secret";

export function getAuthSecret() {
  const secret = process.env["AUTH_SECRET"]?.trim() ?? "";
  if (!secret || secret === AUTH_SECRET_PLACEHOLDER) {
    throw new Error("Set AUTH_SECRET to a long random string. Do not use the .env.example placeholder.");
  }
  return secret;
}
