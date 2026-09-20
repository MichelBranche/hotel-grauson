import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@pms-core/config/demo";
import type { SessionUser } from "@pms-core/types";

export const SESSION_COOKIE = "pms_session";
const MAX_AGE = 60 * 60 * 12;

function secret() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function readSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.role || !payload.propertyId) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      firstName: String(payload.firstName ?? ""),
      lastName: String(payload.lastName ?? ""),
      role: payload.role as SessionUser["role"],
      propertyId: String(payload.propertyId),
      organizationId: String(payload.organizationId ?? ""),
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}
