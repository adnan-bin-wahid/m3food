import { cn, formatCurrency, discountPercent } from "./utils";

interface PriceTextProps {
  price: number;
  originalPrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showDiscount?: boolean;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

/** Displays BDT-formatted price with optional original (strikethrough) and discount %. */
export function PriceText({
  price,
  originalPrice,
  className,
  size = "md",
  showDiscount = true,
}: PriceTextProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const pct = hasDiscount ? discountPercent(originalPrice!, price) : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span
        className={cn(
          "font-semibold",
          sizeMap[size],
          hasDiscount ? "text-[var(--color-error)]" : "text-[var(--color-text-primary)]",
        )}
      >
        {formatCurrency(price)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-[var(--color-text-muted)] line-through",
              size === "xl" ? "text-base" : "text-sm",
            )}
          >
            {formatCurrency(originalPrice!)}
          </span>
          {showDiscount && pct > 0 && (
            <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-[var(--color-error)] text-white">
              -{pct}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
