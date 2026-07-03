"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonDangerClass } from "@/components/ui";

export default function DeleteButton({
  url,
  redirectTo,
  confirmMessage = "Are you sure you want to delete this?",
}: {
  url: string;
  redirectTo: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      await fetch(url, { method: "DELETE" });
      router.push(redirectTo);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={buttonDangerClass}
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
