"use client";

import { useState } from "react";

import { revealGuestDocumentAction } from "@pms-core/actions/reservations";
import { documentTypeLabel, maskedDocument } from "@pms-core/lib/check-in-guest";

/** Shows a masked document number. The full value stays in memory only while revealed. */
export function MaskedDocument({
  guestId,
  documentType,
  last4,
  canReveal,
}: {
  guestId: string;
  documentType: string | null;
  last4: string | null;
  canReveal: boolean;
}) {
  const [shown, setShown] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const registered = Boolean(documentType || last4);

  async function reveal() {
    if (shown) {
      setShown(null);
      return;
    }
    setPending(true);
    const result = await revealGuestDocumentAction(guestId);
    setPending(false);
    if (!result.ok || !result.data.documentNumber) return;
    setShown(result.data.documentNumber);
  }

  if (!registered) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>
        {documentTypeLabel(documentType)} · {shown ?? maskedDocument(last4)}
      </span>
      {canReveal ? (
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline disabled:opacity-50"
          aria-pressed={shown !== null}
          disabled={pending}
          onClick={() => void reveal()}
        >
          {pending ? "Attendere" : shown ? "Nascondi numero" : "Mostra numero"}
        </button>
      ) : null}
    </span>
  );
}
