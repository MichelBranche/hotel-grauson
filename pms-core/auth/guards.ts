import { cookies } from "next/headers";

import { can, type Permission } from "@pms-core/config/permissions";
import { ForbiddenError, UnauthorizedError } from "@pms-core/lib/errors";
import { prisma } from "@pms-core/database/client";
import { readSession, SESSION_COOKIE } from "@pms-core/auth/session";
import type { SessionUser } from "@pms-core/types";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Accedi al PMS per continuare.");
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireSession();
  if (!can(session.role, permission)) {
    throw new ForbiddenError("Non hai i permessi per questa operazione.");
  }
  return session;
}

export async function requireActiveUser() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) {
    throw new UnauthorizedError("Utente non attivo.");
  }
  return { session, user };
}
