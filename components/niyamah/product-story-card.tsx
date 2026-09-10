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

function toBnNum(num: number): string {
  return String(num).padStart(2, "0").replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
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
    "--story-card-bg": tone?.panel ?? "#330d1b",
    "--story-card-text": tone?.text ?? "#ffffff",
    "--story-card-muted": tone?.muted ?? "rgba(255,235,240,0.78)",
    "--story-card-accent": tone?.accent ?? "#f4a261",
    "--story-badge-bg": tone?.badgeBg ?? "#92123e",
    "--story-badge-text": tone?.badgeText ?? "#ffffff",
  } as CSSProperties;

  const handleOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = document.querySelector("#order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "#order-section";
    }
  };

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
        "group relative h-[380px] shrink-0 origin-center overflow-hidden rounded-2xl border border-white/20 bg-[var(--story-card-bg)] text-[var(--story-card-text)] shadow-[0_24px_70px_rgba(0,0,0,0.28)] [contain:layout_paint] will-change-[width,transform] sm:h-[440px]",
        active
          ? "opacity-100 ring-2 ring-[#ffeab0]/50"
          : "opacity-75 hover:opacity-90 cursor-pointer",
        className,
      )}
      aria-current={active ? "true" : undefined}
    >
      {onSelect && !active && (
        <button
          type="button"
          tabIndex={0}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
          className="absolute inset-0 z-30 cursor-pointer"
          aria-label={`Show ${product.name}`}
        />
      )}

      {/* Luxury Background Shading */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.14)_0%,transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-[21] w-px bg-white/40 opacity-0 shadow-[12px_0_24px_rgba(0,0,0,0.3)] transition-opacity duration-500",
          active && "opacity-100",
        )}
      />

      {/* Product Image Showcase */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-24">
        <div className="relative h-full w-full">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 430px, 500px"
            className={cn(
              "object-contain filter drop-shadow-[0_18px_25px_rgba(0,0,0,0.55)] transition duration-700 group-hover:scale-105",
              active ? "scale-100" : "scale-95",
            )}
          />
        </div>
      </div>

      {/* Card Content Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/30 bg-[var(--story-badge-bg)] px-2.5 py-1 text-[10px] font-bold uppercase leading-none text-[var(--story-badge-text)] shadow-sm">
              {product.badge ?? (pct > 0 ? `${pct}% ছাড়` : "বিশেষ অফার")}
            </span>
            {product.isNew && (
              <span className="rounded-full border border-amber-300/40 bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase leading-none text-[#2d0c19]">
                নতুন
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-bold text-white/70">
            {toBnNum(index + 1)}
          </span>
        </div>

        {/* Bottom Details */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#ffeab0]/90">
            {product.storyLabel ?? product.categoryName ?? "নিয়ামাহ্ স্পেশাল"}
          </p>

          <h3
            className={cn(
              "font-serif font-bold leading-tight text-white transition-all duration-500",
              active
                ? "max-w-[20rem] text-xl opacity-100 sm:text-2xl"
                : "max-w-[8rem] text-sm opacity-90 sm:text-base line-clamp-2",
            )}
          >
            {product.name}
          </h3>

          {/* Price Row */}
          <div
            className={cn(
              "mt-3 flex flex-wrap items-baseline gap-2.5 transition-all duration-500",
              active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0",
            )}
          >
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#ffeab0] drop-shadow-sm">
              ৳{product.price.toLocaleString("bn-BD")}/-
            </span>
            {product.originalPrice && (
              <del className="text-white/60 text-xs sm:text-sm">
                ৳{product.originalPrice.toLocaleString("bn-BD")}/-
              </del>
            )}
            {product.badge && (
              <span className="rounded bg-[#ffeab0]/20 px-2 py-0.5 text-[10px] font-bold text-[#ffeab0] border border-[#ffeab0]/40">
                {product.badge}
              </span>
            )}
          </div>

          {/* Action Row */}
          <div
            className={cn(
              "pointer-events-auto relative z-30 mt-3.5 flex items-center gap-2.5 transition-all duration-500",
              active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0",
            )}
          >
            <a
              href="#order-section"
              onClick={handleOrderClick}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#ffe7a4]/60 bg-gradient-to-r from-[#bf2b61] to-[#8e1b42] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(142,27,66,0.45)] transition-all duration-300 hover:brightness-110 active:scale-95"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[#ffeab0]" />
              <span>এখনই অর্ডার করুন</span>
            </a>
            <div className="pointer-events-auto">
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
        </div>
      </div>
    </motion.article>
  );
}
