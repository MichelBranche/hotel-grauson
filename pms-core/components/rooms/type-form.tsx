"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createRoomTypeAction, updateRoomTypeAction } from "@pms-core/actions/rooms";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input, Textarea } from "@pms-core/components/ui/input";
import { roomTypeInputSchema, splitList } from "@pms-core/lib/structure";
import type { StructureType } from "@pms-core/components/rooms/types";

type FormValues = z.input<typeof roomTypeInputSchema>;

function Section({
  eyebrow,
  hint,
  children,
}: {
  eyebrow: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[var(--pms-line)] bg-white px-4 py-4 sm:px-5">
      <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-[var(--pms-muted)] uppercase">{eyebrow}</p>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-[var(--pms-muted)]">{hint}</p> : null}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function RoomTypeForm({
  type,
  onDone,
}: {
  type?: StructureType;
  onDone: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(roomTypeInputSchema),
    defaultValues: {
      name: type?.name ?? "",
      code: type?.code ?? "",
      description: type?.description ?? "",
      capacity: type?.capacity ?? 2,
      maxAdults: type?.maxAdults || type?.capacity || 2,
      maxChildren: type?.maxChildren ?? 0,
      sizeM2: type?.sizeM2 ?? undefined,
      beds: type?.beds ?? "",
      bathroom: type?.bathroom ?? "",
      amenities: type?.amenities ?? [],
      images: type?.images ?? [],
      basePrice: type?.basePrice ?? 0,
      active: type?.active ?? true,
      sortOrder: type?.sortOrder,
    },
  });

  return (
    <form
      className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      onSubmit={form.handleSubmit(async (values) => {
        const sizeM2 =
          typeof values.sizeM2 === "number" && Number.isFinite(values.sizeM2) ? values.sizeM2 : null;
        const payload = {
          ...values,
          amenities: values.amenities ?? [],
          images: values.images ?? [],
          sizeM2,
        };
        const result = type
          ? await updateRoomTypeAction(type.id, payload)
          : await createRoomTypeAction(roomTypeInputSchema.parse(payload));
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(type ? "Tipologia aggiornata." : "Tipologia creata.");
        onDone();
      })}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pms-scroll px-6 py-5">
        <Section eyebrow="Identità" hint="Come compare in planning, booking e sulle schede camera.">
          <div className="grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Standard" />
            </Field>
            <Field label="Codice" error={form.formState.errors.code?.message}>
              <Input
                {...form.register("code", {
                  onChange: (event) => form.setValue("code", event.target.value.toUpperCase()),
                })}
                placeholder="STD"
                maxLength={16}
                className="uppercase tracking-[0.08em]"
              />
            </Field>
          </div>
          <Field label="Descrizione" error={form.formState.errors.description?.message}>
            <Textarea
              {...form.register("description")}
              placeholder="Camera con vista sul bosco, bagno privato e balcone."
              className="min-h-[5.5rem]"
            />
          </Field>
        </Section>

        <Section eyebrow="Capienza" hint="I massimi guidano disponibilità e nuove prenotazioni. Lo storico non cambia.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ospiti" error={form.formState.errors.capacity?.message}>
              <Input type="number" min={1} {...form.register("capacity", { valueAsNumber: true })} />
            </Field>
            <Field label="Adulti" error={form.formState.errors.maxAdults?.message}>
              <Input type="number" min={1} {...form.register("maxAdults", { valueAsNumber: true })} />
            </Field>
            <Field label="Bambini" error={form.formState.errors.maxChildren?.message}>
              <Input type="number" min={0} {...form.register("maxChildren", { valueAsNumber: true })} />
            </Field>
          </div>
        </Section>

        <Section eyebrow="Spazio" hint="Dettagli fisici per reception e scheda camera. Non influenzano il prezzo di vendita.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Superficie" error={form.formState.errors.sizeM2?.message}>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  {...form.register("sizeM2", { valueAsNumber: true })}
                  placeholder="20"
                  className="pr-10"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[var(--pms-muted)]">
                  m²
                </span>
              </div>
            </Field>
            <Field label="Letti" error={form.formState.errors.beds?.message}>
              <Input {...form.register("beds")} placeholder="1 matrimoniale" />
            </Field>
          </div>
          <Field label="Bagno" error={form.formState.errors.bathroom?.message}>
            <Input {...form.register("bathroom")} placeholder="Privato, doccia" />
          </Field>
          <Field label="Servizi">
            <Input
              defaultValue={(type?.amenities ?? []).join(", ")}
              onChange={(event) => form.setValue("amenities", splitList(event.target.value))}
              placeholder="Wi-Fi, balcone, cassaforte"
            />
            <span className="mt-1.5 block text-xs text-[var(--pms-muted)]">Separati da virgola.</span>
          </Field>
          <Field label="Immagini">
            <Textarea
              defaultValue={(type?.images ?? []).join("\n")}
              onChange={(event) => form.setValue("images", splitList(event.target.value))}
              placeholder="https://…"
              className="min-h-20"
            />
            <span className="mt-1.5 block text-xs text-[var(--pms-muted)]">Opzionale. Un URL per riga.</span>
          </Field>
        </Section>

        <Section eyebrow="Prezzo e visibilità" hint="Il prezzo base è un riferimento. Le tariffe di vendita restano sui rate plan.">
          <Field label="Prezzo base a notte" error={form.formState.errors.basePrice?.message}>
            <div className="relative max-w-[12rem]">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--pms-muted)]">
                €
              </span>
              <Input
                type="number"
                min={0}
                step="1"
                {...form.register("basePrice", { valueAsNumber: true })}
                placeholder="120"
                className="pl-7"
              />
            </div>
          </Field>
          <label className="flex items-start justify-between gap-4 rounded-[16px] border border-[var(--pms-line)] bg-[var(--pms-surface)] px-4 py-3">
            <span>
              <span className="block text-sm">Tipologia attiva</span>
              <span className="mt-0.5 block text-xs leading-5 text-[var(--pms-muted)]">
                Visibile in disponibilità e nel booking engine.
              </span>
            </span>
            <input type="checkbox" {...form.register("active")} className="mt-0.5 size-4 accent-[var(--pms-alpine)]" />
          </label>
        </Section>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--pms-line)] bg-[var(--pms-surface)] px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvataggio…" : type ? "Salva tipologia" : "Crea tipologia"}
        </Button>
      </div>
    </form>
  );
}
