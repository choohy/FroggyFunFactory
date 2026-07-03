"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({
  venueId,
  initialFavorite,
  size = "md",
}: {
  venueId: string;
  initialFavorite: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);

    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      startTransition(() => router.refresh());
    } catch {
      setIsFavorite(!next);
    }
  }

  const sizeClass = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`${sizeClass} leading-none transition-transform hover:scale-110 disabled:opacity-50 ${
        isFavorite ? "text-red-500" : "text-zinc-300 dark:text-zinc-600"
      }`}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}
