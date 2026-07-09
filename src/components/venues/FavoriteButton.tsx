import { useState } from "react";
import { setVenueFavorite } from "@/lib/venues";

export default function FavoriteButton({
  venueId,
  initialFavorite,
  size = "md",
  onChange,
}: {
  venueId: string;
  initialFavorite: boolean;
  size?: "sm" | "md";
  onChange?: (next: boolean) => void;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, setIsPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    setIsPending(true);

    try {
      await setVenueFavorite(venueId, next);
      onChange?.(next);
    } catch {
      setIsFavorite(!next);
    } finally {
      setIsPending(false);
    }
  }

  const sizeClass = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <button
      type="button"
      onClick={(e) => void toggle(e)}
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
