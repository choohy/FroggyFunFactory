import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonDangerClass } from "@/components/ui";

export default function DeleteButton({
  onDelete,
  redirectTo,
  confirmMessage = "Are you sure you want to delete this?",
}: {
  onDelete: () => Promise<void>;
  redirectTo: string;
  confirmMessage?: string;
}) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      await onDelete();
      navigate(redirectTo);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={deleting}
      className={buttonDangerClass}
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
