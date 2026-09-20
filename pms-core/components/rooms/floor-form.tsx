"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFloorAction, updateFloorAction } from "@pms-core/actions/rooms";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input, Textarea } from "@pms-core/components/ui/input";
import { floorInputSchema } from "@pms-core/lib/structure";
import type { StructureFloor } from "@pms-core/components/rooms/types";

type FormValues = z.input<typeof floorInputSchema>;

export function FloorForm({
  floor,
  nextOrder = 0,
  onDone,
}: {
  floor?: StructureFloor;
  nextOrder?: number;
  onDone: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(floorInputSchema),
    defaultValues: {
      name: floor?.name ?? "",
      displayName: floor?.displayName ?? "",
      sortOrder: floor?.sortOrder ?? nextOrder,
      description: floor?.description ?? "",
      active: floor?.active ?? true,
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit(async (values) => {
        const result = floor ? await updateFloorAction(floor.id, values) : await createFloorAction(floorInputSchema.parse(values));
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(floor ? "Piano aggiornato." : "Piano creato.");
        onDone();
      })}
    >
      <Field label="Nome interno" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="1" />
      </Field>
      <Field label="Nome visibile" error={form.formState.errors.displayName?.message}>
        <Input {...form.register("displayName")} placeholder="1° piano" />
      </Field>
      <Field label="Ordine" error={form.formState.errors.sortOrder?.message}>
        <Input type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
      </Field>
      <Field label="Descrizione">
        <Textarea {...form.register("description")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("active")} className="size-4 accent-[var(--pms-alpine)]" />
        Piano attivo
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvataggio…" : floor ? "Salva piano" : "Crea piano"}
        </Button>
      </div>
    </form>
  );
}
