"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createSeasonAction, updateSeasonAction } from "@pms-core/actions/rates";
import { Toggle } from "@pms-core/components/rates/plan-form";
import { issuesByField, numberOrNull, numberText, type PlanView, type RoomTypeView, type SeasonView } from "@pms-core/components/rates/types";
import { Button } from "@pms-core/components/ui/button";
import { DatePicker } from "@pms-core/components/ui/date-picker";
import { Field, Input, Select } from "@pms-core/components/ui/input";
import { nightsBetween } from "@pms-core/lib/dates";
import { seasonInputSchema } from "@pms-core/lib/rates";

export function SeasonForm({
  season,
  plans,
  roomTypes,
  onDone,
}: {
  season?: SeasonView;
  plans: PlanView[];
  roomTypes: RoomTypeView[];
  onDone: () => void;
}) {
  const [values, setValues] = useState({
    name: season?.name ?? "",
    ratePlanId: season?.ratePlanId ?? "",
    startDate: season?.startDate ?? "",
    endDate: season?.endDate ?? "",
    minStay: numberText(season?.minStay),
    maxStay: numberText(season?.maxStay),
    closedToArrival: season?.closedToArrival ?? false,
    closedToDeparture: season?.closedToDeparture ?? false,
    notes: season?.notes ?? "",
  });
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(roomTypes.map((type) => [type.id, numberText(season?.prices[type.id])])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }));

  const nights =
    values.startDate && values.endDate && values.endDate >= values.startDate ? nightsBetween(values.startDate, values.endDate) + 1 : 0;
  const plan = plans.find((item) => item.id === values.ratePlanId) ?? plans.find((item) => item.active) ?? plans[0];
  const basePrice = (type: RoomTypeView) => plan?.prices[type.id] ?? (type.basePrice > 0 ? type.basePrice : null);

  return (
    <form
      className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = seasonInputSchema.safeParse({
          ...values,
          ratePlanId: values.ratePlanId || null,
          minStay: numberOrNull(values.minStay),
          maxStay: numberOrNull(values.maxStay),
          prices: roomTypes.map((type) => ({ roomTypeId: type.id, price: numberOrNull(prices[type.id] ?? "") })),
        });
        if (!parsed.success) {
          setErrors(issuesByField(parsed.error));
          return;
        }
        setErrors({});
        setPending(true);
        const result = season ? await updateSeasonAction(season.id, parsed.data) : await createSeasonAction(parsed.data);
        setPending(false);
        if (!result.ok) {
          setErrors({ form: result.error });
          toast.error(result.error);
          return;
        }
        toast.success(season ? "Stagione aggiornata." : "Stagione creata.");
        onDone();
      }}
    >
      <div className="min-h-0 space-y-4 overflow-y-auto pms-scroll px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
          <Field label="Nome" error={errors.name}>
            <Input value={values.name} onChange={(event) => set("name", event.target.value)} placeholder="Natale" />
          </Field>
          <Field label="Vale per" error={errors.ratePlanId}>
            <Select value={values.ratePlanId} onChange={(event) => set("ratePlanId", event.target.value)}>
              <option value="">Tutte le tariffe</option>
              {plans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.active ? "" : " (disattivata)"}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prima notte" error={errors.startDate}>
            <DatePicker
              value={values.startDate}
              rangeStart={values.startDate}
              rangeEnd={values.endDate}
              onChange={(value) => {
                set("startDate", value);
                if (!values.endDate || values.endDate < value) set("endDate", value);
              }}
            />
          </Field>
          <Field label="Ultima notte (inclusa)" error={errors.endDate}>
            <DatePicker
              value={values.endDate}
              min={values.startDate || undefined}
              rangeStart={values.startDate}
              rangeEnd={values.endDate}
              onChange={(value) => set("endDate", value)}
            />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-[var(--pms-muted)]">
          {nights
            ? `${nights} ${nights === 1 ? "notte" : "notti"}: chi dorme l'ultima notte parte il giorno dopo.`
            : "Le notti dalla prima all'ultima, entrambe incluse."}
        </p>

        <div className="rounded-[20px] border border-[var(--pms-line)] bg-white px-4 py-4">
          <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-[var(--pms-muted)] uppercase">Prezzo a notte</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pms-muted)]">Vuoto = resta il prezzo base della tariffa (in grigio).</p>
          {roomTypes.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--pms-muted)]">Nessuna tipologia: creale in Camere.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {roomTypes.map((type) => (
                <label key={type.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {type.name}
                    {!type.active ? <span className="ml-2 text-xs text-[var(--pms-muted)]">disattivata</span> : null}
                  </span>
                  <span className="relative w-32 shrink-0">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--pms-muted)]">€</span>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      inputMode="decimal"
                      value={prices[type.id] ?? ""}
                      placeholder={basePrice(type) !== null ? String(basePrice(type)) : "—"}
                      onChange={(event) => setPrices((current) => ({ ...current, [type.id]: event.target.value }))}
                      className="h-9 pl-7 text-right tabular-nums"
                    />
                  </span>
                </label>
              ))}
            </div>
          )}
          {Object.entries(errors).find(([key]) => key.startsWith("prices"))?.[1] ? (
            <p className="mt-2 text-xs text-[#8a3b3b]">{Object.entries(errors).find(([key]) => key.startsWith("prices"))?.[1]}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Soggiorno minimo (notti)" error={errors.minStay}>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={values.minStay}
              onChange={(event) => set("minStay", event.target.value)}
              placeholder="Come la tariffa"
            />
          </Field>
          <Field label="Soggiorno massimo" error={errors.maxStay}>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={values.maxStay}
              onChange={(event) => set("maxStay", event.target.value)}
              placeholder="Nessun limite"
            />
          </Field>
        </div>
        <p className="-mt-2 text-xs leading-5 text-[var(--pms-muted)]">
          Se un soggiorno tocca anche una sola notte della stagione, vale il minimo più alto tra tariffa e stagione.
        </p>
        <div className="grid gap-2">
          <Toggle
            label="Chiuso agli arrivi"
            hint="Nessun check-in nelle notti della stagione."
            checked={values.closedToArrival}
            onChange={(checked) => set("closedToArrival", checked)}
          />
          <Toggle
            label="Chiuso alle partenze"
            hint="Nessun check-out nei giorni della stagione."
            checked={values.closedToDeparture}
            onChange={(checked) => set("closedToDeparture", checked)}
          />
        </div>
        <Field label="Note interne" error={errors.notes}>
          <Input value={values.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Opzionale" />
        </Field>
        {errors.form ? (
          <p role="alert" className="rounded-2xl bg-[rgb(138_59_59_/_0.08)] px-4 py-3 text-sm text-[#8a3b3b]">
            {errors.form}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--pms-line)] bg-[var(--pms-surface)] px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : season ? "Salva stagione" : "Crea stagione"}
        </Button>
      </div>
    </form>
  );
}
