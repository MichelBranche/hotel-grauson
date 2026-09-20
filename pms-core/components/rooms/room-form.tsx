"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createRoomAction, updateRoomAction } from "@pms-core/actions/rooms";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input, Select, Textarea } from "@pms-core/components/ui/input";
import { roomInputSchema, roomStatuses } from "@pms-core/lib/structure";
import { roomStatusMeta } from "@pms-core/config/status";
import type { StructureFloor, StructureRoom, StructureType } from "@pms-core/components/rooms/types";

type FormValues = z.input<typeof roomInputSchema>;

export function RoomForm({
  room,
  types,
  floors,
  onDone,
}: {
  room?: StructureRoom;
  types: StructureType[];
  floors: StructureFloor[];
  onDone: () => void;
}) {
  const assignableTypes = types.filter((type) => type.active || type.id === room?.roomTypeId);
  const assignableFloors = floors.filter((floor) => floor.active || floor.id === room?.floorId);

  const form = useForm<FormValues>({
    resolver: zodResolver(roomInputSchema),
    defaultValues: {
      number: room?.number ?? "",
      name: room?.name ?? "",
      roomTypeId: room?.roomTypeId ?? assignableTypes[0]?.id ?? "",
      floorId: room?.floorId ?? assignableFloors[0]?.id ?? "",
      capacity: room?.capacity ?? assignableTypes[0]?.capacity ?? 2,
      status: room?.status ?? "AVAILABLE",
      notes: room?.notes ?? "",
      customBasePrice: room?.customBasePrice ?? undefined,
      active: room?.active ?? true,
    },
  });

  return (
    <form
      className="grid max-h-[70vh] gap-3 overflow-y-auto pms-scroll pr-1"
      onSubmit={form.handleSubmit(async (values) => {
        const customBasePrice =
          typeof values.customBasePrice === "number" && Number.isFinite(values.customBasePrice)
            ? values.customBasePrice
            : null;
        const payload = {
          ...values,
          name: values.name || null,
          floorId: values.floorId || null,
          customBasePrice,
        };
        const result = room
          ? await updateRoomAction(room.id, payload)
          : await createRoomAction(roomInputSchema.parse(payload));
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(room ? "Camera aggiornata." : "Camera creata.");
        onDone();
      })}
    >
      <Field label="Numero / nome" error={form.formState.errors.number?.message}>
        <Input {...form.register("number")} placeholder="101" />
      </Field>
      <Field label="Nome descrittivo" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="Opzionale" />
      </Field>
      <Field label="Tipologia" error={form.formState.errors.roomTypeId?.message}>
        <Select
          {...form.register("roomTypeId", {
            onChange: (event) => {
              const type = types.find((item) => item.id === event.target.value);
              if (type && !room) form.setValue("capacity", type.capacity);
            },
          })}
        >
          {assignableTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} · {type.code}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Piano" error={form.formState.errors.floorId?.message}>
        <Select {...form.register("floorId")}>
          <option value="">Nessun piano</option>
          {assignableFloors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.displayName}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Capienza" error={form.formState.errors.capacity?.message}>
          <Input type="number" min={1} {...form.register("capacity", { valueAsNumber: true })} />
        </Field>
        <Field label="Stato operativo" error={form.formState.errors.status?.message}>
          <Select {...form.register("status")}>
            {roomStatuses.map((status) => (
              <option key={status} value={status}>
                {roomStatusMeta[status].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Prezzo base personalizzato" error={form.formState.errors.customBasePrice?.message}>
        <Input type="number" min={0} step="1" {...form.register("customBasePrice", { valueAsNumber: true })} placeholder="Lascia vuoto per usare la tipologia" />
      </Field>
      <Field label="Note operative">
        <Textarea {...form.register("notes")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("active")} className="size-4 accent-[var(--pms-alpine)]" />
        Camera attiva
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvataggio…" : room ? "Salva camera" : "Crea camera"}
        </Button>
      </div>
    </form>
  );
}
