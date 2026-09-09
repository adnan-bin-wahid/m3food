"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "./reference-link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { cn } from "./utils";
import {
  HERO_THEME_PRESETS,
  HOMEPAGE_DEFAULTS,
  type HeroSlideData,
  type HeroThemeName,
} from "./homepage-defaults";

interface HeroSliderProps {
  slides: HeroSlideData[];
  autoPlayMs?: number;
  className?: string;
}

type NormalizedHeroSlide = HeroSlideData & {
  eyebrow: string;
  productName: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  bigWord1: string;
  bigWord2: string;
  shortName: string;
  metadataLine: string;
  productImage: string;
  theme: HeroThemeName;
  infoItems: { label: string; value: string }[];
};

const PLACEHOLDER_TEXT = new Set(
  [
    "new product feature",
    "product",
    "featured product",
    "short product promise",
    "write a short customer-friendly message for this slide.",
  ].map((value) => value.toLowerCase()),
);

function isPlaceholder(value?: string | null) {
  if (!value) return false;
  const clean = value.trim().toLowerCase();
  return PLACEHOLDER_TEXT.has(clean) || clean.includes("write a short");
}

function limitText(value: string | undefined, fallback: string, max: number) {
  const clean = value?.trim();
  const safe = clean && !isPlaceholder(clean) ? clean : fallback;
  return safe.length > max ? `${safe.slice(0, Math.max(0, max - 1)).trim()}...` : safe;
}

function nonDraftSlide(slide: HeroSlideData) {
  return slide.status !== "draft";
}

function firstUsable(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim() && !isPlaceholder(value))?.trim();
}

function imageForSlide(slide: HeroSlideData, fallback: HeroSlideData) {
  const image = slide.productImage?.trim();
  if (image) return image;

  const key = `${slide.id} ${slide.productName ?? ""} ${slide.cardName ?? ""} ${slide.title ?? ""}`.toLowerCase();
  if (key.includes("gift")) return "/niyamah/hero/hero-gift-box.png";
  if (key.includes("prayer") || key.includes("tasbih")) return "/niyamah/hero/hero-prayer-mat.png";
  if (key.includes("quran") || key.includes("barakah")) return "/niyamah/hero/hero-quran.png";

  return fallback.productImage || "/logo.png";
}

function legacyFallbackText(value: string | undefined, fallback: string) {
  const clean = value?.trim();
  return clean && !isPlaceholder(clean) ? clean : fallback;
}

function normalizeSlide(slide: HeroSlideData, index: number): NormalizedHeroSlide {
  const fallback = HOMEPAGE_DEFAULTS.hero[index % HOMEPAGE_DEFAULTS.hero.length] as HeroSlideData;
  const titleLine1 = limitText(
    firstUsable(slide.titleLine1, slide.title),
    fallback.titleLine1 || fallback.title,
    22,
  );
  const titleLine2 = limitText(
    firstUsable(slide.titleLine2, slide.highlight),
    fallback.titleLine2 || fallback.highlight || "With Meaning",
    22,
  );
  const description = limitText(
    firstUsable(slide.description, slide.subtitle),
    fallback.description || fallback.subtitle,
    120,
  );
  const productName = limitText(
    firstUsable(slide.productName, slide.subheading, slide.cardName),
    fallback.productName || "Islamic Essentials",
    30,
  );
  const cta = slide.ctaPrimary ?? fallback.ctaPrimary;

  return {
    ...slide,
    eyebrow: limitText(firstUsable(slide.eyebrow), fallback.eyebrow || "Niyamah Collection", 28),
    productName,
    titleLine1,
    titleLine2,
    title: titleLine1,
    highlight: titleLine2,
    description,
    subtitle: description,
    primaryButtonText: limitText(firstUsable(slide.primaryButtonText, cta?.label), "Shop Now", 18),
    primaryButtonLink: slide.primaryButtonLink || cta?.href || "/products",
    bigWord1: limitText(firstUsable(slide.bigWord1, slide.decoration, productName), "NIYAMAH", 12).toUpperCase(),
    bigWord2: limitText(firstUsable(slide.bigWord2, slide.highlight), "COLLECTION", 12).toUpperCase(),
    shortName: limitText(firstUsable(slide.shortName, slide.cardName, productName), productName, 18),
    metadataLine: limitText(firstUsable(slide.metadataLine, slide.badge), "Collection / New Arrival", 30),
    productImage: imageForSlide(slide, fallback),
    productImageAlt: slide.productImageAlt || productName,
    subheading: legacyFallbackText(slide.subheading, fallback.subheading || productName),
    theme: slide.theme && slide.theme in HERO_THEME_PRESETS ? slide.theme : fallback.theme || "cream",
    infoItems:
      slide.infoItems && slide.infoItems.length > 0
        ? slide.infoItems.slice(0, 3)
        : [
            { label: "Delivery", value: "1-3 days" },
            { label: "Payment", value: "COD" },
            { label: "Support", value: "WhatsApp" },
          ],
  };
}

function getVisibleSlides(slides: HeroSlideData[]) {
  const source = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const visible = source.filter(nonDraftSlide);
  const curatedFallback = (HOMEPAGE_DEFAULTS.hero as HeroSlideData[]).filter(nonDraftSlide);
  return (visible.length > 0 ? visible : curatedFallback).map(normalizeSlide);
}

function slideNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function HeroSlider({ slides, autoPlayMs = 7200, className }: HeroSliderProps) {
  const safeSlides = useMemo(() => getVisibleSlides(slides), [slides]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const rootRef = useRef<HTMLElement | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileThumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const max = safeSlides.length;
  const safeCurrent = max > 0 ? current % max : 0;
  const active = safeSlides[safeCurrent];

  const scrollThumbnailRail = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return;

    const rail = button.closest("[data-hero-thumbnail-rail]") as HTMLElement | null;
    if (!rail) return;

    const left = button.offsetLeft - (rail.clientWidth - button.clientWidth) / 2;
    rail.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth",
    });
  }, []);

  const prev = useCallback(() => {
    if (max < 2) return;
    setDirection(-1);
    setCurrent((value) => (value - 1 + max) % max);
  }, [max]);

  const next = useCallback(() => {
    if (max < 2) return;
    setDirection(1);
    setCurrent((value) => (value + 1) % max);
  }, [max]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (max < 2 || !isHeroVisible) return;
    const id = window.setInterval(next, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, isHeroVisible, max, next]);

  useEffect(() => {
    // Never use scrollIntoView here. It can scroll the whole page back to the
    // hero section when autoplay changes while the user is reading lower content.
    scrollThumbnailRail(thumbnailRefs.current[safeCurrent] ?? null);
    scrollThumbnailRail(mobileThumbnailRefs.current[safeCurrent] ?? null);
  }, [safeCurrent, scrollThumbnailRail]);

  if (!active) return null;

  const theme = HERO_THEME_PRESETS[active.theme];
  const rootStyle = {
    "--hero-bg": theme.bg,
    "--hero-text": theme.text,
    "--hero-muted": theme.muted,
    "--hero-accent": theme.accent,
    "--hero-button-bg": theme.buttonBg,
    "--hero-button-text": theme.buttonText,
    "--hero-panel": theme.panel,
    "--hero-word": theme.word,
    "--hero-shadow": theme.shadow,
  } as CSSProperties;

  return (
    <section
      ref={rootRef}
      className={cn(
        "allfather-product-slider relative isolate min-h-[890px] overflow-hidden bg-[var(--hero-bg)] text-[var(--hero-text)] sm:min-h-[940px] lg:min-h-[calc(100svh-64px)]",
        className,
      )}
      style={rootStyle}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(30deg,currentColor_1px,transparent_1px),linear-gradient(150deg,currentColor_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="pointer-events-none absolute right-[7%] top-[10%] hidden h-[520px] w-[360px] rounded-t-full border border-[var(--hero-accent)]/35 lg:block" />

      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={active.id ?? safeCurrent}
          custom={direction}
          variants={{
            enter: (way: number) => ({ x: `${way * 100}vw`, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            leave: (way: number) => ({ x: `${way * -100}vw`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="leave"
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end overflow-hidden pb-28 pt-72 sm:pt-80 lg:justify-center lg:pb-28 lg:pt-20">
            {[active.bigWord1, active.bigWord1, active.bigWord2, active.bigWord2].map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ x: index % 2 === 0 ? -80 : 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.05, delay: 0.08 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "block whitespace-nowrap font-black uppercase leading-[0.78] tracking-normal text-[var(--hero-word)]",
                  "text-[24vw] sm:text-[18vw] md:text-[15vw] lg:text-[13vw]",
                  index % 2 === 1 && "self-end",
                )}
              >
                {word}
              </motion.span>
            ))}
          </div>

          <div className="relative z-10 mx-auto grid min-h-[890px] w-full max-w-[1500px] grid-rows-[auto_auto_auto] gap-4 px-4 pb-10 pt-28 sm:min-h-[940px] sm:px-6 sm:pt-36 lg:min-h-[calc(100svh-64px)] lg:grid-cols-[minmax(320px,0.95fr)_minmax(440px,1fr)_minmax(270px,0.85fr)] lg:grid-rows-1 lg:gap-5 lg:gap-x-8 lg:px-8 lg:pb-32 lg:pt-8 xl:px-10">
            <motion.aside
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="row-start-1 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--hero-text)]/10 pb-3 lg:col-start-3 lg:row-start-1 lg:block lg:border-b-0 lg:pb-0 lg:pt-16"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--hero-muted)] lg:text-[11px] lg:tracking-[0.24em]">
                  {active.eyebrow}
                </p>
                <p className="mt-2 max-w-[15rem] text-lg font-semibold leading-tight text-[var(--hero-text)] lg:mt-3 lg:text-xl">
                  {active.productName}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hero-accent)] lg:text-xs lg:tracking-[0.2em]">
                  {active.metadataLine}
                </p>
              </div>
              <div className="text-right text-xs font-black tracking-[0.18em] text-[var(--hero-muted)] lg:hidden">
                {slideNumber(safeCurrent)}
                <span className="mx-1 text-[var(--hero-accent)]">/</span>
                {slideNumber(max - 1)}
              </div>
              <div className="hidden h-px w-24 bg-[var(--hero-accent)] lg:mt-8 lg:block" />
            </motion.aside>

            <motion.div
              initial={{ opacity: 0, y: 42, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative row-start-2 flex min-h-[205px] items-center justify-center sm:min-h-[300px] lg:col-start-1 lg:row-start-1 lg:min-h-[620px]"
            >
              <div className="absolute h-[240px] w-[240px] rounded-full bg-[var(--hero-accent)]/25 blur-[76px] sm:h-[320px] sm:w-[320px] lg:h-[360px] lg:w-[360px] lg:blur-[86px]" />
              <div className="absolute inset-x-[18%] bottom-[12%] h-12 rounded-full bg-black/15 blur-2xl" />
              <div className="relative h-[215px] w-full max-w-[440px] sm:h-[320px] lg:h-[580px] lg:max-w-[540px]">
                <ImageWithFallback
                  src={active.productImage}
                  alt={active.productImageAlt || active.productName}
                  fill
                  priority={safeCurrent === 0}
                  sizes="(max-width: 768px) 92vw, (max-width: 1200px) 48vw, 620px"
                  className="scale-[1.08] object-contain drop-shadow-[0_35px_60px_var(--hero-shadow)] sm:scale-[1.12] lg:scale-[1.08]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.78, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="row-start-3 flex flex-col justify-center lg:col-start-2 lg:row-start-1 lg:pt-16"
            >
              <div className="max-w-xl lg:max-w-md">
                <p className="mb-2 text-sm font-bold text-[var(--hero-accent)] lg:mb-3">
                  {active.subheading || active.productName}
                </p>
                <h1 className="font-black uppercase leading-[0.9] tracking-normal text-[clamp(2rem,9.8vw,4rem)] text-[var(--hero-text)] lg:text-[clamp(3.4rem,4.6vw,5.2rem)]">
                  <motion.span
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className="block"
                  >
                    {active.titleLine1}
                  </motion.span>
                  <motion.span
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-[var(--hero-accent)]"
                  >
                    {active.titleLine2}
                  </motion.span>
                </h1>
                <p className="mt-4 line-clamp-2 max-w-md text-sm font-medium leading-6 text-[var(--hero-muted)] sm:line-clamp-3 sm:text-base sm:leading-7 lg:mt-5">
                  {active.description}
                </p>
                <motion.div
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 lg:mt-7"
                >
                  <Link
                    href={active.primaryButtonLink}
                    style={{
                      backgroundColor: "var(--hero-button-bg)",
                      color: "var(--hero-button-text)",
                    }}
                    className="ml-12 inline-flex h-10 items-center justify-center px-4 text-xs font-black uppercase tracking-[0.14em] shadow-[0_18px_42px_rgba(0,0,0,0.14)] transition-transform duration-300 hover:-translate-y-0.5 sm:h-12 sm:px-6 sm:text-sm lg:ml-0 lg:tracking-[0.18em]"
                  >
                    {active.primaryButtonText}
                  </Link>
                </motion.div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--hero-text)]/15 pt-3 lg:mt-6 lg:gap-3 lg:pt-4">
                  {active.infoItems.slice(0, 3).map((spec, index) => (
                    <div key={`${spec.label}-${index}`} className="min-w-0">
                      <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[var(--hero-muted)] sm:text-[10px] lg:tracking-[0.22em]">
                        {spec.label}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-[var(--hero-text)] sm:text-sm md:text-base">
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {max > 1 && (
        <>
          <div className="absolute inset-x-0 top-3 z-40 px-4 lg:hidden">
            <div
              data-hero-thumbnail-rail
              className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-3 pr-4">
                {safeSlides.map((slide, index) => {
                  const selected = index === safeCurrent;
                  return (
                    <button
                      key={slide.id ?? index}
                      ref={(node) => {
                        mobileThumbnailRefs.current[index] = node;
                      }}
                      type="button"
                      onClick={() => { setDirection(index >= safeCurrent ? 1 : -1); setCurrent(index); }}
                      aria-pressed={selected}
                      className={cn(
                        "group relative flex h-20 min-w-[142px] overflow-hidden border p-3 text-left backdrop-blur transition-all duration-500 sm:h-24 sm:min-w-[180px]",
                        selected
                          ? "min-w-[170px] border-[var(--hero-accent)] bg-white/72 shadow-[0_16px_36px_rgba(0,0,0,0.13)] sm:min-w-[210px]"
                          : "border-[var(--hero-text)]/12 bg-white/28 opacity-65",
                      )}
                      aria-label={`Show ${slide.shortName}`}
                    >
                      <div className="absolute inset-0 opacity-20">
                        <ImageWithFallback
                          src={slide.productImage}
                          alt=""
                          fill
                          sizes="180px"
                          className="object-contain p-2"
                        />
                      </div>
                      <span className="relative z-10 max-w-[6.5rem] text-sm font-black text-[var(--hero-text)]">
                        {slide.shortName}
                      </span>
                      <span className="relative z-10 ml-auto text-sm font-black tracking-[0.16em] text-[var(--hero-text)]">
                        {slideNumber(index)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-[46%] z-40 hidden h-11 w-11 items-center justify-center border border-[var(--hero-text)]/15 bg-[var(--hero-panel)] text-[var(--hero-text)] backdrop-blur transition-colors hover:border-[var(--hero-accent)] lg:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-[46%] z-40 hidden h-11 w-11 items-center justify-center border border-[var(--hero-text)]/15 bg-[var(--hero-panel)] text-[var(--hero-text)] backdrop-blur transition-colors hover:border-[var(--hero-accent)] lg:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[var(--hero-accent)]/45 bg-[var(--hero-panel)] text-[var(--hero-accent)] backdrop-blur lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[var(--hero-accent)]/45 bg-[var(--hero-panel)] text-[var(--hero-accent)] backdrop-blur lg:hidden"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="niyamah-hero-rail absolute bottom-5 right-4 z-40 hidden w-[min(38rem,calc(100vw-2rem))] overflow-hidden lg:block xl:right-6">
            <div
              data-hero-thumbnail-rail
              className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-3 pr-1">
              {safeSlides.slice(0, 6).map((slide, index) => {
                const selected = index === safeCurrent;
                return (
                  <button
                    key={slide.id ?? index}
                    ref={(node) => {
                      thumbnailRefs.current[index] = node;
                    }}
                    type="button"
                    onClick={() => { setDirection(index >= safeCurrent ? 1 : -1); setCurrent(index); }}
                    aria-pressed={selected}
                    className={cn(
                      "group flex min-w-[152px] items-center gap-3 border p-2 text-left backdrop-blur transition-all duration-500",
                      selected
                        ? "min-w-[190px] border-[var(--hero-accent)] bg-white/70 shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                        : "border-[var(--hero-text)]/10 bg-white/25 opacity-60 hover:opacity-100",
                    )}
                    aria-label={`Show ${slide.shortName}`}
                  >
                    <div className="relative h-14 w-14 shrink-0 bg-[var(--hero-panel)]">
                      <ImageWithFallback
                        src={slide.productImage}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-[var(--hero-text)]">
                        {slide.shortName}
                      </p>
                      <p className="mt-1 text-xs font-black tracking-[0.2em] text-[var(--hero-muted)]">
                        {slideNumber(index)}
                      </p>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </div>

        </>
      )}
    </section>
  );
}
