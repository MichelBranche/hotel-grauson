"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createRatePlanAction, updateRatePlanAction } from "@pms-core/actions/rates";
import { issuesByField, numberOrNull, numberText, type PlanView } from "@pms-core/components/rates/types";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input, Textarea } from "@pms-core/components/ui/input";
import { ratePlanInputSchema } from "@pms-core/lib/rates";

export function PlanForm({ plan, onDone }: { plan?: PlanView; onDone: () => void }) {
  const [values, setValues] = useState({
    name: plan?.name ?? "",
    code: plan?.code ?? "",
    cancellationPolicy: plan?.cancellationPolicy ?? "",
    depositPercent: numberText(plan?.depositPercent ?? 0),
    minimumStay: numberText(plan?.minimumStay ?? 1),
    maximumStay: numberText(plan?.maximumStay),
    isRefundable: plan?.isRefundable ?? true,
    active: plan?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = ratePlanInputSchema.safeParse({
          ...values,
          depositPercent: numberOrNull(values.depositPercent) ?? 0,
          minimumStay: numberOrNull(values.minimumStay) ?? 1,
          maximumStay: numberOrNull(values.maximumStay),
        });
        if (!parsed.success) {
          setErrors(issuesByField(parsed.error));
          return;
        }
        setErrors({});
        setPending(true);
        const result = plan ? await updateRatePlanAction(plan.id, parsed.data) : await createRatePlanAction(parsed.data);
        setPending(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(plan ? "Piano tariffario aggiornato." : "Piano tariffario creato.");
        onDone();
      }}
    >
      <div className="min-h-0 space-y-4 overflow-y-auto pms-scroll px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
          <Field label="Nome" error={errors.name}>
            <Input value={values.name} onChange={(event) => set("name", event.target.value)} placeholder="Tariffa standard" />
          </Field>
          <Field label="Codice" error={errors.code}>
            <Input
              value={values.code}
              onChange={(event) => set("code", event.target.value.toUpperCase())}
              placeholder="STD"
              maxLength={16}
              className="uppercase tracking-[0.08em]"
            />
          </Field>
        </div>
        <Field label="Politica di cancellazione" error={errors.cancellationPolicy}>
          <Textarea
            value={values.cancellationPolicy}
            onChange={(event) => set("cancellationPolicy", event.target.value)}
            placeholder="Cancellazione gratuita fino a 48 ore prima dell'arrivo."
            className="min-h-20"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Soggiorno minimo (notti)" error={errors.minimumStay}>
            <Input type="number" min={1} inputMode="numeric" value={values.minimumStay} onChange={(event) => set("minimumStay", event.target.value)} />
          </Field>
          <Field label="Soggiorno massimo" error={errors.maximumStay}>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={values.maximumStay}
              onChange={(event) => set("maximumStay", event.target.value)}
              placeholder="Nessun limite"
            />
          </Field>
          <Field label="Acconto (%)" error={errors.depositPercent}>
            <Input type="number" min={0} max={100} inputMode="decimal" value={values.depositPercent} onChange={(event) => set("depositPercent", event.target.value)} />
          </Field>
        </div>
        <p className="text-xs leading-5 text-[var(--pms-muted)]">
          Valgono tutto l&apos;anno. Nelle stagioni si può chiedere un minimo più alto: vale sempre la regola più restrittiva.
        </p>
        <div className="grid gap-2">
          <Toggle
            label="Rimborsabile"
            hint="Mostrato a reception e ospiti accanto al prezzo."
            checked={values.isRefundable}
            onChange={(checked) => set("isRefundable", checked)}
          />
          <Toggle
            label="Tariffa attiva"
            hint="Solo le tariffe attive sono vendibili in PMS e sul sito."
            checked={values.active}
            onChange={(checked) => set("active", checked)}
          />
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--pms-line)] bg-[var(--pms-surface)] px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : plan ? "Salva tariffa" : "Crea tariffa"}
        </Button>
      </div>
    </form>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[16px] border border-[var(--pms-line)] bg-white px-4 py-3 transition-colors hover:border-[rgb(37_39_33_/_0.16)]">
      <span>
        <span className="block text-sm">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-5 text-[var(--pms-muted)]">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-[var(--pms-alpine)]"
      />
    </label>
  );
}
