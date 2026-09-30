"use client";

import { useEffect, useState } from "react";

import { checkInReservationAction, loadCheckInDeskAction } from "@pms-core/actions/reservations";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input, Select } from "@pms-core/components/ui/input";
import {
  DOCUMENT_TYPES,
  companionIdentityReady,
  documentReady,
  documentTypeLabel,
  maskedDocument,
  primaryIdentityReady,
  type CheckInGuestFields,
} from "@pms-core/lib/check-in-guest";
import { formatLong } from "@pms-core/lib/dates";

const STEPS = ["Soggiorno", "Ospiti", "Documenti", "Conferma"] as const;

type DeskStay = {
  code: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomNumber: string;
  roomTypeName: string;
  blocked: string | null;
  primary: DeskGuest;
  companions: DeskGuest[];
};

type DeskGuest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentCountry: string | null;
  documentExpiresOn: string | null;
};

type Draft = {
  key: string;
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  documentType: string;
  documentNumber: string;
  documentCountry: string;
  documentExpiresOn: string;
};

const emptyDraft = (key: string): Draft => ({
  key,
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  documentType: "",
  documentNumber: "",
  documentCountry: "",
  documentExpiresOn: "",
});

function toDraft(guest: DeskGuest): Draft {
  return {
    key: guest.id,
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    country: guest.country ?? "",
    documentType: guest.documentType ?? "",
    documentNumber: guest.documentNumber ?? "",
    documentCountry: guest.documentCountry ?? "",
    documentExpiresOn: guest.documentExpiresOn ?? "",
  };
}

function asFields(draft: Draft): CheckInGuestFields {
  return {
    id: draft.id,
    firstName: draft.firstName,
    lastName: draft.lastName,
    email: draft.email,
    phone: draft.phone,
    country: draft.country,
    documentType: draft.documentType,
    documentNumber: draft.documentNumber,
    documentCountry: draft.documentCountry,
    documentExpiresOn: draft.documentExpiresOn,
  };
}

export function CheckInDesk({
  open,
  reservationId,
  onOpenChange,
  onCompleted,
}: {
  open: boolean;
  reservationId: string;
  onOpenChange: (open: boolean) => void;
  onCompleted: (result: Awaited<ReturnType<typeof checkInReservationAction>>) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stay, setStay] = useState<DeskStay | null>(null);
  const [primary, setPrimary] = useState<Draft>(emptyDraft("primary"));
  const [companions, setCompanions] = useState<Draft[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [draftSeq, setDraftSeq] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLoading(true);
      setLoadError(null);
      setStep(0);
    } else {
      setStep(0);
      setStay(null);
      setPrimary(emptyDraft("primary"));
      setCompanions([]);
      setRevealed({});
      setLoadError(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadCheckInDeskAction(reservationId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLoadError("Impossibile caricare il check-in.");
        return;
      }
      setStay(result.data);
      setPrimary(toDraft(result.data.primary));
      setCompanions(result.data.companions.map(toDraft));
    });
    return () => {
      cancelled = true;
    };
  }, [open, reservationId]);

  const partySize = (stay?.adults ?? 1) + (stay?.children ?? 0);
  const companionLimit = Math.max(0, partySize - 1);
  const identityReady = primaryIdentityReady(primary) && companions.every(companionIdentityReady);
  const documentsReady = documentReady(primary) && companions.every(documentReady);
  const blocked = stay?.blocked ?? null;
  const stepReady = step === 0 ? Boolean(stay) && !blocked && !loadError : step === 1 ? identityReady : step === 2 ? documentsReady : documentsReady && !blocked;

  function patchPrimary(patch: Partial<Draft>) {
    setPrimary((current) => ({ ...current, ...patch }));
  }

  function patchCompanion(key: string, patch: Partial<Draft>) {
    setCompanions((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function confirm() {
    if (!stepReady || pending) return;
    setPending(true);
    const result = await checkInReservationAction(reservationId, {
      primary: asFields(primary),
      companions: companions.map(asFields),
    });
    setPending(false);
    await onCompleted(result);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
      title="Check-in"
      description={STEPS[step]}
      className="w-[min(760px,calc(100vw-1.5rem))]"
    >
      <div className="grid gap-5">
        <ol className="flex flex-wrap gap-2 text-xs">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${index === step ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "bg-[var(--pms-surface-dark)] text-[var(--pms-muted)]"}`}
                aria-current={index === step ? "step" : undefined}
                disabled={pending || index > step || (index > 0 && !stay)}
                onClick={() => setStep(index)}
              >
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        {loading ? <p className="text-sm text-[var(--pms-muted)]">Caricamento del soggiorno.</p> : null}
        {loadError ? <p className="text-sm text-[#8a3b3b]">{loadError}</p> : null}

        {stay && step === 0 ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--pms-muted)]">Codice</dt>
              <dd>{stay.code}</dd>
            </div>
            <div>
              <dt className="text-[var(--pms-muted)]">Camera</dt>
              <dd>
                {stay.roomNumber} · {stay.roomTypeName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--pms-muted)]">Arrivo</dt>
              <dd>{formatLong(stay.checkIn)}</dd>
            </div>
            <div>
              <dt className="text-[var(--pms-muted)]">Partenza</dt>
              <dd>
                {formatLong(stay.checkOut)} · {stay.nights} {stay.nights === 1 ? "notte" : "notti"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--pms-muted)]">Ospiti previsti</dt>
              <dd>
                {stay.adults} {stay.adults === 1 ? "adulto" : "adulti"}
                {stay.children ? ` · ${stay.children} ${stay.children === 1 ? "bambino" : "bambini"}` : ""}
              </dd>
            </div>
          </dl>
        ) : null}
        {stay && step === 0 && blocked ? <p className="text-sm text-[#8a3b3b]">{blocked}</p> : null}

        {stay && step === 1 ? (
          <div className="grid gap-5">
            <GuestIdentity
              title="Ospite principale"
              draft={primary}
              email
              phoneRequired
              onChange={patchPrimary}
            />
            {companionLimit > 0 ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm">Altri ospiti della camera</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={companions.length >= companionLimit}
                    onClick={() => {
                      const next = draftSeq + 1;
                      setDraftSeq(next);
                      setCompanions((current) => [...current, emptyDraft(`new-${next}`)]);
                    }}
                  >
                    Aggiungi ospite
                  </Button>
                </div>
                {companions.length === 0 ? <p className="text-sm text-[var(--pms-muted)]">Nessun altro ospite inserito.</p> : null}
                {companions.map((companion, index) => (
                  <div key={companion.key} className="grid gap-3 rounded-2xl border border-[var(--pms-line)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm">Ospite {index + 2}</p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCompanions((current) => current.filter((item) => item.key !== companion.key))}>
                        Rimuovi
                      </Button>
                    </div>
                    <GuestIdentity title="" draft={companion} onChange={(patch) => patchCompanion(companion.key, patch)} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {stay && step === 2 ? (
          <div className="grid gap-4">
            <p className="text-sm text-[var(--pms-muted)]">I dati restano in anagrafica per la gestione del soggiorno.</p>
            <GuestDocument
              title={`${primary.lastName} ${primary.firstName}`.trim() || "Ospite principale"}
              draft={primary}
              revealed={Boolean(revealed[primary.key])}
              onReveal={() => setRevealed((current) => ({ ...current, [primary.key]: !current[primary.key] }))}
              onChange={patchPrimary}
            />
            {companions.map((companion) => (
              <GuestDocument
                key={companion.key}
                title={`${companion.lastName} ${companion.firstName}`.trim() || "Ospite"}
                draft={companion}
                revealed={Boolean(revealed[companion.key])}
                onReveal={() => setRevealed((current) => ({ ...current, [companion.key]: !current[companion.key] }))}
                onChange={(patch) => patchCompanion(companion.key, patch)}
              />
            ))}
          </div>
        ) : null}

        {stay && step === 3 ? (
          <div className="grid gap-4 text-sm">
            <p>
              {stay.code} · camera {stay.roomNumber}. La camera risulterà occupata.
            </p>
            <ul className="grid gap-3">
              {[primary, ...companions].map((guest, index) => (
                <li key={guest.key} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p>
                    {guest.lastName} {guest.firstName}
                    <span className="text-[var(--pms-muted)]"> · {index === 0 ? "Ospite principale" : "Ospite"}</span>
                  </p>
                  <p className="text-[var(--pms-muted)]">
                    {guest.country || "Paese mancante"}
                    {index === 0 && guest.phone ? ` · ${guest.phone}` : ""}
                  </p>
                  <p>
                    {documentTypeLabel(guest.documentType)} · {revealed[guest.key] ? guest.documentNumber : maskedDocument(guest.documentNumber.length >= 8 ? guest.documentNumber.replace(/\s+/g, "").slice(-4) : null)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setStep((current) => current - 1)}>
              Indietro
            </Button>
          ) : (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" disabled={!stepReady || loading || pending} onClick={() => setStep((current) => current + 1)}>
              Continua
            </Button>
          ) : (
            <Button type="button" pending={pending} disabled={!stepReady} onClick={() => void confirm()}>
              Conferma check-in
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function GuestIdentity({
  title,
  draft,
  email = false,
  phoneRequired = false,
  onChange,
}: {
  title: string;
  draft: Draft;
  email?: boolean;
  phoneRequired?: boolean;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="grid gap-3">
      {title ? <p className="text-sm">{title}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <Input value={draft.firstName} autoComplete="off" onChange={(event) => onChange({ firstName: event.target.value })} required />
        </Field>
        <Field label="Cognome">
          <Input value={draft.lastName} autoComplete="off" onChange={(event) => onChange({ lastName: event.target.value })} required />
        </Field>
        <Field label={phoneRequired ? "Telefono" : "Telefono (facoltativo)"}>
          <Input value={draft.phone} autoComplete="off" onChange={(event) => onChange({ phone: event.target.value })} required={phoneRequired} />
        </Field>
        <Field label="Paese">
          <Input value={draft.country} autoComplete="off" placeholder="Es. IT" onChange={(event) => onChange({ country: event.target.value })} required />
        </Field>
        {email ? (
          <Field label="Email (facoltativa)">
            <Input type="text" inputMode="email" autoComplete="off" value={draft.email} onChange={(event) => onChange({ email: event.target.value })} />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

function GuestDocument({
  title,
  draft,
  revealed,
  onReveal,
  onChange,
}: {
  title: string;
  draft: Draft;
  revealed: boolean;
  onReveal: () => void;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--pms-line)] p-4">
      <p className="text-sm">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo documento">
          <Select value={draft.documentType} onChange={(event) => onChange({ documentType: event.target.value })} required>
            <option value="">Seleziona</option>
            {DOCUMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Numero documento">
          <div className="flex gap-2">
            <Input
              className="min-w-0"
              type={revealed ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={draft.documentNumber}
              onChange={(event) => onChange({ documentNumber: event.target.value })}
              required
            />
            <Button type="button" variant="outline" size="sm" aria-pressed={revealed} onClick={onReveal}>
              {revealed ? "Nascondi" : "Mostra"}
            </Button>
          </div>
        </Field>
        <Field label="Paese di emissione (facoltativo)">
          <Input value={draft.documentCountry} autoComplete="off" placeholder="Es. IT" onChange={(event) => onChange({ documentCountry: event.target.value })} />
        </Field>
        <Field label="Scadenza (facoltativa)">
          <Input type="date" autoComplete="off" value={draft.documentExpiresOn} onChange={(event) => onChange({ documentExpiresOn: event.target.value })} />
        </Field>
      </div>
    </div>
  );
}
