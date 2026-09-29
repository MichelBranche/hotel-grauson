"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { deleteGuestAction } from "@pms-core/actions/guests";
import { reportAction } from "@pms-core/components/ui/action-feedback";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog } from "@pms-core/components/ui/dialog";

export function DeleteGuestButton({
  id,
  name,
  redirectToList = false,
}: {
  id: string;
  name: string;
  redirectToList?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function openConfirm(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={redirectToList ? "default" : "sm"}
        onClick={openConfirm}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {redirectToList ? "Elimina ospite" : "Elimina"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminare l'ospite?"
        description={`Eliminare ${name}? L'operazione non è reversibile.`}
        confirmLabel="Elimina ospite"
        danger
        onConfirm={async () => {
          const result = await deleteGuestAction(id);
          const ok = reportAction(`guest-delete-${id}`, result, "Ospite eliminato.");
          if (!ok) return;
          if (redirectToList) router.push("/pms/guests");
          else router.refresh();
        }}
      />
    </>
  );
}
