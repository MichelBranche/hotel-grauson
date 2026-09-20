import { requirePermission } from "@pms-core/auth/guards";
import { prisma } from "@pms-core/database/client";
import { auditService } from "@pms-core/services/audit.service";
import { SettingsForm } from "@pms-core/components/settings/form";

export default async function SettingsPage() {
  const session = await requirePermission("settings.read");
  const property = await prisma.property.findUniqueOrThrow({ where: { id: session.propertyId } });
  const audit = await auditService.list(session.propertyId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="pms-card p-5">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl">Impostazioni</h1>
        <p className="mt-1 text-sm text-[var(--pms-muted)]">Dati della property. La business logic usa propertyId, non il nome hotel.</p>
        <div className="mt-5">
          <SettingsForm property={property} />
        </div>
      </section>
      <section className="pms-card p-5">
        <h2 className="text-sm text-[var(--pms-muted)]">Audit recente</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {audit.slice(0, 12).map((entry) => (
            <li key={entry.id}>
              <p>{entry.action}</p>
              <p className="text-xs text-[var(--pms-muted)]">{entry.createdAt.toLocaleString("it-IT")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
