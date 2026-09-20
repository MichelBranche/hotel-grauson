"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updatePropertySettingsAction } from "@pms-core/actions/settings";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input } from "@pms-core/components/ui/input";

export function SettingsForm({
  property,
}: {
  property: {
    name: string;
    address: string | null;
    city: string;
    postalCode: string | null;
    country: string;
    timezone: string;
    currency: string;
    language: string;
  };
}) {
  const [form, setForm] = useState({
    name: property.name,
    address: property.address ?? "",
    city: property.city,
    postalCode: property.postalCode ?? "",
    country: property.country,
    timezone: property.timezone,
    currency: property.currency,
    language: property.language,
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await updatePropertySettingsAction(form);
        if (!result.ok) toast.error(result.error);
        else toast.success("Impostazioni aggiornate.");
      }}
    >
      {Object.entries(form).map(([key, value]) => (
        <Field key={key} label={key}>
          <Input value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </Field>
      ))}
      <Button type="submit">Salva</Button>
    </form>
  );
}
