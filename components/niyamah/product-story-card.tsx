"use client";

import type { CSSProperties } from "react";
import Link from "./reference-link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { AddToCartButton } from "./product-actions";
import type { ProductCardData } from "./product-types";
import { ImageWithFallback } from "./image-with-fallback";
import { PriceText } from "./price-text";
import { WishlistButton } from "./product-actions";
import { cn, discountPercent } from "./utils";

export type ProductStoryTone = {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
};

export type ProductStoryCardData = ProductCardData & {
  badge?: string;
  storyLabel?: string;
  tone?: ProductStoryTone;
};

interface ProductStoryCardProps {
  product: ProductStoryCardData;
  index: number;
  active?: boolean;
  onSelect?: () => void;
  className?: string;
}

function shortProductName(name: string) {
  return name.length > 52 ? `${name.slice(0, 49).trim()}...` : name;
}

export function ProductStoryCard({
  product,
  index,
  active = false,
  onSelect,
  className,
}: ProductStoryCardProps) {
  const pct = product.originalPrice
    ? discountPercent(product.originalPrice, product.price)
    : 0;
  const tone = product.tone;
  const style = {
    "--story-card-bg": tone?.panel ?? "#123d2a",
    "--story-card-text": tone?.text ?? "#ffffff",
    "--story-card-muted": tone?.muted ?? "rgba(255,255,255,0.72)",
    "--story-card-accent": tone?.accent ?? "#c9a24d",
    "--story-badge-bg": tone?.badgeBg ?? "#c9a24d",
    "--story-badge-text": tone?.badgeText ?? "#123d2a",
  } as CSSProperties;

  return (
    <motion.article
      style={style}
      animate={{
        width: active ? "min(78vw, 520px)" : "min(28vw, 160px)",
        scale: active ? 1 : 0.96,
        rotateY: active ? 0 : index % 2 === 0 ? -3 : 3,
      }}
      transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative h-[360px] shrink-0 origin-center overflow-hidden rounded-lg border border-white/20 bg-[var(--story-card-bg)] text-[var(--story-card-text)] shadow-[0_24px_70px_rgba(0,0,0,0.2)] [contain:layout_paint] will-change-[width,transform] sm:h-[420px]",
        active
          ? "opacity-100"
          : "opacity-80 hover:opacity-95",
        className,
      )}
      aria-current={active ? "true" : undefined}
    >
      {onSelect && (
        <button
          type="button"
          tabIndex={active ? -1 : 0}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={`Show ${product.name}`}
        />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.32),transparent_30%),linear-gradient(135deg,rgba(0,0,0,0.1),rgba(0,0,0,0.58))]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-[21] w-px bg-white/35 opacity-0 shadow-[12px_0_24px_rgba(0,0,0,0.28)] transition-opacity duration-500",
          active && "opacity-100",
        )}
      />

      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0"
        aria-label={product.name}
      >
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 430px, 500px"
          className={cn(
            "object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-95",
            active ? "scale-100" : "scale-110",
          )}
        />
      </Link>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-[var(--story-badge-bg)] px-2 py-1 text-[10px] font-black uppercase leading-none text-[var(--story-badge-text)]">
              {product.badge ?? (pct > 0 ? `${pct}% off` : "Featured")}
            </span>
            {product.isNew && (
              <span className="rounded bg-white/90 px-2 py-1 text-[10px] font-black uppercase leading-none text-[#133b2a]">
                New
              </span>
            )}
          </div>
          <span className="text-xs font-black text-white/70">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-black uppercase text-white/68">
            {product.storyLabel ?? product.categoryName ?? "Niyamah Pick"}
          </p>
          <Link href={`/products/${product.slug}`} className="pointer-events-auto inline-block">
            <h3
              className={cn(
                "font-black leading-[1.03] text-white transition-all duration-500",
                active
                  ? "max-w-[18rem] text-2xl opacity-100 sm:text-3xl"
                  : "max-w-[7rem] text-lg opacity-90 sm:text-xl",
              )}
            >
              {shortProductName(product.name)}
            </h3>
          </Link>

          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-3 transition-all duration-500",
              active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0",
            )}
          >
            <PriceText
              price={product.price}
              originalPrice={product.originalPrice}
              size="md"
              showDiscount={false}
              className="[&_span]:!text-white [&_span+span]:!text-white/65"
            />
            <div className="pointer-events-auto relative z-30">
              <WishlistButton
                product={{
                  id: product.id,
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  image: product.image,
                  price: product.price,
                  originalPrice: product.originalPrice,
                }}
              />
            </div>
          </div>

          <div
            className={cn(
              "pointer-events-auto relative z-30 mt-4 flex items-center gap-2 transition-all duration-500",
              active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0",
            )}
          >
            <AddToCartButton
              productId={product.id}
              variantId={product.variantId}
              name={product.name}
              slug={product.slug}
              image={product.image}
              price={product.price}
              originalPrice={product.originalPrice}
              inStock={product.inStock ?? true}
              size="sm"
              className="h-10 rounded bg-white px-4 text-[#123d2a] hover:bg-white/90"
            />
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-white/35 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label={`View ${product.name}`}
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
