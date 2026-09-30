"use client";

import { useEffect, useState } from "react";

import { checkInReservationAction, loadCheckInDeskAction } from "@pms-core/actions/reservations";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input, Select } from "@pms-core/components/ui/input";
import {
  DOCUMENT_TYPES,
  SEX_OPTIONS,
  checkInCompanionBlank,
  checkInGuestComplete,
  documentLast4,
  documentTypeLabel,
  maskedDocument,
  type CheckInGuestFields,
} from "@pms-core/lib/check-in-guest";
import { formatLong } from "@pms-core/lib/dates";

const STEPS = ["Soggiorno", "Ospiti", "Conferma"] as const;

type DeskGuest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  birthPlace: string | null;
  citizenship: string | null;
  residenceAddress: string | null;
  residencePostalCode: string | null;
  residenceCity: string | null;
  residenceProvince: string | null;
  residenceCountry: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentAuthority: string | null;
  documentIssuedOn: string | null;
  documentCountry: string | null;
  documentExpiresOn: string | null;
};

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

type Draft = {
  key: string;
  id: string | null;
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  birthPlace: string;
  citizenship: string;
  email: string;
  phone: string;
  residenceAddress: string;
  residencePostalCode: string;
  residenceCity: string;
  residenceProvince: string;
  residenceCountry: string;
  documentType: string;
  documentNumber: string;
  documentAuthority: string;
  documentIssuedOn: string;
  documentCountry: string;
  documentExpiresOn: string;
};

const emptyDraft = (key: string): Draft => ({
  key,
  id: null,
  firstName: "",
  lastName: "",
  sex: "",
  dateOfBirth: "",
  birthPlace: "",
  citizenship: "",
  email: "",
  phone: "",
  residenceAddress: "",
  residencePostalCode: "",
  residenceCity: "",
  residenceProvince: "",
  residenceCountry: "",
  documentType: "",
  documentNumber: "",
  documentAuthority: "",
  documentIssuedOn: "",
  documentCountry: "",
  documentExpiresOn: "",
});

function toDraft(guest: DeskGuest): Draft {
  return {
    key: guest.id,
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    sex: guest.sex ?? "",
    dateOfBirth: guest.dateOfBirth ?? "",
    birthPlace: guest.birthPlace ?? "",
    citizenship: guest.citizenship ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    residenceAddress: guest.residenceAddress ?? "",
    residencePostalCode: guest.residencePostalCode ?? "",
    residenceCity: guest.residenceCity ?? "",
    residenceProvince: guest.residenceProvince ?? "",
    residenceCountry: guest.residenceCountry ?? "",
    documentType: guest.documentType ?? "",
    documentNumber: guest.documentNumber ?? "",
    documentAuthority: guest.documentAuthority ?? "",
    documentIssuedOn: guest.documentIssuedOn ?? "",
    documentCountry: guest.documentCountry ?? "",
    documentExpiresOn: guest.documentExpiresOn ?? "",
  };
}

function asFields(draft: Draft): CheckInGuestFields {
  return { ...draft, id: draft.id };
}

function padCompanions(existing: Draft[], limit: number) {
  const next = existing.slice(0, limit);
  while (next.length < limit) next.push(emptyDraft(`slot-${next.length + 1}`));
  return next;
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
      const limit = Math.max(0, result.data.adults + result.data.children - 1);
      setStay(result.data);
      setPrimary(toDraft(result.data.primary));
      setCompanions(padCompanions(result.data.companions.map(toDraft), limit));
    });
    return () => {
      cancelled = true;
    };
  }, [open, reservationId]);

  const partySize = (stay?.adults ?? 1) + (stay?.children ?? 0);
  const companionLimit = Math.max(0, partySize - 1);
  const entered = companions.filter((guest) => !checkInCompanionBlank(asFields(guest)));
  const guestsReady = checkInGuestComplete(asFields(primary)) && entered.every((guest) => checkInGuestComplete(asFields(guest)));
  const blocked = stay?.blocked ?? null;
  const stepReady = step === 0 ? Boolean(stay) && !blocked && !loadError : guestsReady && !blocked;

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
      companions: entered.map(asFields),
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
            <p className="text-sm text-[var(--pms-muted)]">
              Composizione della camera: {partySize} {partySize === 1 ? "persona" : "persone"}. Il capogruppo è obbligatorio. Compila gli altri ospiti presenti. Telefono ed email sono facoltativi. Per la residenza in Italia servono anche CAP e provincia.
            </p>
            <GuestCard title="Capogruppo" role="Capogruppo" draft={primary} revealed={Boolean(revealed[primary.key])} onReveal={() => setRevealed((current) => ({ ...current, [primary.key]: !current[primary.key] }))} onChange={patchPrimary} />
            {companions.map((companion, index) => {
              const started = !checkInCompanionBlank(asFields(companion));
              return (
                <div key={companion.key} className="grid gap-3">
                  {started || companion.id ? (
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCompanions((current) => current.filter((item) => item.key !== companion.key))}>
                        Rimuovi ospite
                      </Button>
                    </div>
                  ) : null}
                  <GuestCard
                    title={`Ospite ${index + 2}`}
                    role="Ospite"
                    draft={companion}
                    revealed={Boolean(revealed[companion.key])}
                    onReveal={() => setRevealed((current) => ({ ...current, [companion.key]: !current[companion.key] }))}
                    onChange={(patch) => patchCompanion(companion.key, patch)}
                  />
                </div>
              );
            })}
            {companions.length < companionLimit ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompanions((current) => [...current, emptyDraft(`slot-${current.length + 1}-${Date.now()}`)])}
              >
                Aggiungi ospite
              </Button>
            ) : null}
          </div>
        ) : null}

        {stay && step === 2 ? (
          <div className="grid gap-4 text-sm">
            <p>
              {stay.code} · camera {stay.roomNumber}. La camera risulterà occupata.
            </p>
            <ul className="grid gap-3">
              {[primary, ...entered].map((guest) => (
                <li key={guest.key} className="rounded-2xl bg-white/70 px-4 py-3">
                  <p>
                    {guest.lastName} {guest.firstName}
                    <span className="text-[var(--pms-muted)]"> · {guest.key === primary.key ? "Capogruppo" : "Ospite"}</span>
                  </p>
                  <p className="text-[var(--pms-muted)]">
                    {guest.citizenship || "Cittadinanza mancante"}
                    {guest.residenceCity ? ` · ${guest.residenceCity}` : ""}
                  </p>
                  <p>
                    {documentTypeLabel(guest.documentType)} ·{" "}
                    {revealed[guest.key] ? guest.documentNumber : maskedDocument(documentLast4(guest.documentNumber))}
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
          {step < 2 ? (
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

function GuestCard({
  title,
  role,
  draft,
  revealed,
  onReveal,
  onChange,
}: {
  title: string;
  role: string;
  draft: Draft;
  revealed: boolean;
  onReveal: () => void;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--pms-line)] p-4">
      <div>
        <p className="text-sm">{title}</p>
        <p className="text-xs text-[var(--pms-muted)]">Ruolo: {role}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <Input value={draft.firstName} autoComplete="off" onChange={(event) => onChange({ firstName: event.target.value })} required />
        </Field>
        <Field label="Cognome">
          <Input value={draft.lastName} autoComplete="off" onChange={(event) => onChange({ lastName: event.target.value })} required />
        </Field>
        <Field label="Sesso">
          <Select value={draft.sex} onChange={(event) => onChange({ sex: event.target.value })} required>
            <option value="">Seleziona</option>
            {SEX_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data di nascita">
          <Input type="date" autoComplete="off" value={draft.dateOfBirth} onChange={(event) => onChange({ dateOfBirth: event.target.value })} required />
        </Field>
        <Field label="Luogo di nascita">
          <Input value={draft.birthPlace} autoComplete="off" onChange={(event) => onChange({ birthPlace: event.target.value })} required />
        </Field>
        <Field label="Cittadinanza">
          <Input value={draft.citizenship} autoComplete="off" placeholder="Es. IT" onChange={(event) => onChange({ citizenship: event.target.value })} required />
        </Field>
        <Field label="Telefono (facoltativo)">
          <Input value={draft.phone} autoComplete="off" onChange={(event) => onChange({ phone: event.target.value })} />
        </Field>
        <Field label="Email (facoltativa)">
          <Input type="text" inputMode="email" autoComplete="off" value={draft.email} onChange={(event) => onChange({ email: event.target.value })} />
        </Field>
      </div>
      <p className="text-xs text-[var(--pms-muted)]">Residenza</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Indirizzo">
          <Input value={draft.residenceAddress} autoComplete="off" onChange={(event) => onChange({ residenceAddress: event.target.value })} required />
        </Field>
        <Field label="CAP">
          <Input value={draft.residencePostalCode} autoComplete="off" onChange={(event) => onChange({ residencePostalCode: event.target.value })} />
        </Field>
        <Field label="Comune">
          <Input value={draft.residenceCity} autoComplete="off" onChange={(event) => onChange({ residenceCity: event.target.value })} required />
        </Field>
        <Field label="Provincia">
          <Input value={draft.residenceProvince} autoComplete="off" onChange={(event) => onChange({ residenceProvince: event.target.value })} />
        </Field>
        <Field label="Paese di residenza">
          <Input value={draft.residenceCountry} autoComplete="off" placeholder="Es. IT" onChange={(event) => onChange({ residenceCountry: event.target.value })} required />
        </Field>
      </div>
      <p className="text-xs text-[var(--pms-muted)]">Documento</p>
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
        <Field label="Ente di rilascio">
          <Input value={draft.documentAuthority} autoComplete="off" onChange={(event) => onChange({ documentAuthority: event.target.value })} required />
        </Field>
        <Field label="Paese di emissione">
          <Input value={draft.documentCountry} autoComplete="off" placeholder="Es. IT" onChange={(event) => onChange({ documentCountry: event.target.value })} required />
        </Field>
        <Field label="Data di emissione">
          <Input type="date" autoComplete="off" value={draft.documentIssuedOn} onChange={(event) => onChange({ documentIssuedOn: event.target.value })} required />
        </Field>
        <Field label="Data di scadenza">
          <Input type="date" autoComplete="off" value={draft.documentExpiresOn} onChange={(event) => onChange({ documentExpiresOn: event.target.value })} />
        </Field>
      </div>
    </section>
  );
}
