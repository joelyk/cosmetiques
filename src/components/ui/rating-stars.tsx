import { Star } from "lucide-react";

export function RatingStars({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount?: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)]">
      <div className="inline-flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < Math.round(rating);

          return (
            <Star
              key={`${rating}-${index}`}
              className={`h-4 w-4 ${filled ? "fill-current" : ""}`}
            />
          );
        })}
      </div>
      <span>
        {rating.toFixed(1)}
        {reviewCount ? ` (${reviewCount} avis)` : ""}
      </span>
    </div>
  );
}
