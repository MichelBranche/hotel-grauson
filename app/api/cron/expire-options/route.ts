import { revalidatePath } from "next/cache";

import { cronAuthorized } from "@pms-core/lib/option-hold";
import { optionExpiryService } from "@pms-core/services/option-expiry.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET mancante." }, { status: 500 });
  }
  if (!cronAuthorized(request.headers.get("authorization"), secret)) {
    return new Response("Non autorizzato.", { status: 401 });
  }

  const result = await optionExpiryService.expireAbandoned();
  if (result.expired > 0) revalidatePath("/pms", "layout");
  return Response.json({ expired: result.expired, skipped: result.skipped });
}
