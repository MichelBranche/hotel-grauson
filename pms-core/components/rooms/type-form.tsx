"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createRoomTypeAction, updateRoomTypeAction } from "@pms-core/actions/rooms";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input, Textarea } from "@pms-core/components/ui/input";
import { roomTypeInputSchema } from "@pms-core/lib/structure";
import { splitList } from "@pms-core/lib/structure";
import type { StructureType } from "@pms-core/components/rooms/types";

const formSchema = roomTypeInputSchema;

type FormValues = z.input<typeof formSchema>;

export function RoomTypeForm({
  type,
  onDone,
}: {
  type?: StructureType;
  onDone: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
      className="grid max-h-[70vh] gap-4 overflow-y-auto pms-scroll pr-1"
      onSubmit={form.handleSubmit(async (values) => {
        const payload = {
          ...values,
          amenities: values.amenities ?? [],
          images: values.images ?? [],
          sizeM2: values.sizeM2 || null,
        };
        const result = type
          ? await updateRoomTypeAction(type.id, payload)
          : await createRoomTypeAction(formSchema.parse(payload));
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(type ? "Tipologia aggiornata." : "Tipologia creata.");
        onDone();
      })}
    >
      <div>
        <p className="text-xs tracking-[0.14em] text-[var(--pms-muted)] uppercase">Generale</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Nome" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Codice" error={form.formState.errors.code?.message}>
            <Input {...form.register("code")} placeholder="STD" />
          </Field>
        </div>
        <Field label="Descrizione" error={form.formState.errors.description?.message}>
          <Textarea {...form.register("description")} />
        </Field>
      </div>

      <div>
        <p className="text-xs tracking-[0.14em] text-[var(--pms-muted)] uppercase">Capienza</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Ospiti max" error={form.formState.errors.capacity?.message}>
            <Input type="number" min={1} {...form.register("capacity", { valueAsNumber: true })} />
          </Field>
          <Field label="Adulti max" error={form.formState.errors.maxAdults?.message}>
            <Input type="number" min={1} {...form.register("maxAdults", { valueAsNumber: true })} />
          </Field>
          <Field label="Bambini max" error={form.formState.errors.maxChildren?.message}>
            <Input type="number" min={0} {...form.register("maxChildren", { valueAsNumber: true })} />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.14em] text-[var(--pms-muted)] uppercase">Fisico</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Superficie m²" error={form.formState.errors.sizeM2?.message}>
            <Input type="number" min={0} step="0.5" {...form.register("sizeM2", { valueAsNumber: true })} />
          </Field>
          <Field label="Letti" error={form.formState.errors.beds?.message}>
            <Input {...form.register("beds")} />
          </Field>
          <Field label="Bagno" error={form.formState.errors.bathroom?.message}>
            <Input {...form.register("bathroom")} />
          </Field>
          <Field label="Servizi (separati da virgola)">
            <Input
              defaultValue={(type?.amenities ?? []).join(", ")}
              onChange={(event) => form.setValue("amenities", splitList(event.target.value))}
            />
          </Field>
        </div>
        <Field label="Immagini (URL, uno per riga)">
          <Textarea
            defaultValue={(type?.images ?? []).join("\n")}
            onChange={(event) => form.setValue("images", splitList(event.target.value))}
          />
        </Field>
      </div>

      <div>
        <p className="text-xs tracking-[0.14em] text-[var(--pms-muted)] uppercase">Prezzo e stato</p>
        <p className="mt-1 text-xs text-[var(--pms-muted)]">
          Il prezzo base è un riferimento. Le tariffe di vendita restano sui rate plan.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Prezzo base / notte" error={form.formState.errors.basePrice?.message}>
            <Input type="number" min={0} step="1" {...form.register("basePrice", { valueAsNumber: true })} />
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" {...form.register("active")} className="size-4 accent-[var(--pms-alpine)]" />
            Tipologia attiva
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
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
