"use client";

import type { CSSProperties } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductCardData } from "./product-types";
import { ImageWithFallback } from "./image-with-fallback";
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
  nameEn?: string;
  tone?: ProductStoryTone;
};

interface ProductStoryCardProps {
  product: ProductStoryCardData;
  index: number;
  active?: boolean;
  onSelect?: () => void;
  className?: string;
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
    "--story-card-bg": tone?.panel ?? "rgba(68, 18, 36, 0.65)",
    "--story-card-text": tone?.text ?? "#ffffff",
    "--story-card-muted": tone?.muted ?? "rgba(255, 235, 240, 0.72)",
    "--story-card-accent": tone?.accent ?? "#ffeab0",
    "--story-badge-bg": tone?.badgeBg ?? "rgba(146, 18, 62, 0.85)",
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
        width: active ? "min(84vw, 560px)" : "min(24vw, 160px)",
        scale: active ? 1 : 0.94,
        rotateY: active ? 0 : index % 2 === 0 ? -4 : 4,
      }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative h-[420px] shrink-0 origin-center overflow-hidden rounded-[28px] border transition-all duration-700 [contain:layout_paint] will-change-[width,transform] sm:h-[490px]",
        active
          ? "border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,240,245,0.04)_50%,rgba(0,0,0,0.48)_100%)] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl ring-1 ring-[#ffeab0]/35 opacity-100"
          : "border-white/10 bg-black/20 opacity-40 hover:opacity-75 cursor-pointer backdrop-blur-md",
        className,
      )}
      aria-current={active ? "true" : undefined}
    >
      {/* Tap anywhere on inactive card to select */}
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

      {/* Atmospheric Gallery Lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,245,248,0.18)_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Realistic Pedestal Ambient Glow beneath the active object */}
      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[30%] sm:bottom-[28%] left-1/2 -translate-x-1/2 w-[75%] h-12 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(255,234,176,0.22)_0%,rgba(255,255,255,0.05)_50%,transparent_75%)] blur-md"
        />
      )}

      {/* Product Image Showcase — 30-40% Larger Physical Presence */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 pb-24 sm:pb-28">
        <motion.div
          animate={{ scale: active ? 1 : 0.88, y: active ? 0 : 8 }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full w-full max-h-[300px] sm:max-h-[360px]"
        >
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 84vw, (max-width: 1024px) 460px, 560px"
            className={cn(
              "object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.55)] drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)] transition duration-700",
              active ? "group-hover:scale-105" : "",
            )}
          />
        </motion.div>
      </div>

      {/* Card Content Overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Header: Editorial Badge & Number */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#ffeab0] backdrop-blur-md shadow-sm">
              {product.badge ?? (pct > 0 ? `${pct}% ছাড়` : "বিশেষ অফার")}
            </span>
            {active && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-pink-400/25 bg-[#92123e]/80 px-2.5 py-0.5 text-[9.5px] font-mono tracking-wider text-pink-100">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffeab0] animate-pulse" />
                লাইভ ডিল
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-semibold tracking-widest text-white/60">
            {toBnNum(index + 1)}
          </span>
        </div>

        {/* Inactive Card preview caption */}
        {!active && (
          <div className="mt-auto">
            <p className="font-serif text-xs sm:text-sm font-medium text-white/80 truncate">
              {product.name}
            </p>
            <p className="text-[10px] font-mono text-[#ffeab0]/70 mt-0.5">
              ৳{product.price.toLocaleString("bn-BD")}/-
            </p>
          </div>
        )}

        {/* Active Product Storytelling & Order CTA */}
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-1 text-[11px] sm:text-xs font-mono tracking-[0.2em] uppercase text-[#ffeab0]/90">
              {product.storyLabel ?? product.categoryName ?? "নিয়ামাহ্ কালেকশন"}
            </p>

            <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white leading-tight drop-shadow-sm">
              {product.name}
            </h3>

            {/* Price & Savings */}
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#ffeab0] tracking-tight">
                ৳{product.price.toLocaleString("bn-BD")}/-
              </span>
              {product.originalPrice && (
                <del className="text-white/50 text-xs sm:text-sm font-light">
                  ৳{product.originalPrice.toLocaleString("bn-BD")}/-
                </del>
              )}
              {product.badge && (
                <span className="text-[10.5px] font-mono font-semibold text-[#ffeab0] border-b border-[#ffeab0]/40 pb-0.5">
                  {product.badge}
                </span>
              )}
            </div>

            {/* CTA Pill Button (Dior / Chanel Sculpted Style) */}
            <div className="pointer-events-auto relative z-30 mt-3.5 flex items-center gap-3">
              <a
                href="#order-section"
                onClick={handleOrderClick}
                className="group/btn inline-flex h-10 sm:h-11 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#ffeab0] via-[#f7d998] to-[#e5b887] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#3a0e1c] shadow-[0_8px_25px_rgba(255,234,176,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(255,234,176,0.45)] active:scale-95"
              >
                <span>এখনই অর্ডার করুন</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1 text-[#3a0e1c]" />
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
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}
