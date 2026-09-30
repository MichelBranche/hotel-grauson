import { createHash } from "node:crypto";

/**
 * Audit stamp for a document change. Never store the full number.
 * Guest rows keep the number for reception; Alloggiati export is out of scope.
 */
export function documentAuditAfter(documentType: string, documentNumber: string) {
  const compact = documentNumber.replace(/\s+/g, "");
  return {
    documentUpdated: true,
    documentType,
    documentLast4: compact.length >= 8 ? compact.slice(-4) : null,
    documentRef: createHash("sha256").update(compact).digest("hex").slice(0, 8),
  };
}
