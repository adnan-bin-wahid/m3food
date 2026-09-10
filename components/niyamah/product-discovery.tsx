"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

interface CatalogItem {
  id: string;
  category: string;
  nameBn: string;
  subtitleBn: string;
  badge?: string;
  price: number;
  compareAtPrice: number;
  image: string;
  rating: number;
  reviewsCount: number;
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "orchid-perfume",
    category: "attar",
    nameBn: "অর্কিড পারফিউম (Orchid Perfume)",
    subtitleBn: "আর্টিসানাল ফ্রেগ্রেন্স এক্সট্রেইট",
    badge: "সেরা ডিসকাউন্ট",
    price: 850,
    compareAtPrice: 1050,
    image: "/niyamah/slider/slider-1-f.png",
    rating: 5.0,
    reviewsCount: 428,
  },
  {
    id: "floral-prayer-set",
    category: "prayer",
    nameBn: "ফ্লোরাল প্রেয়ার সেট (Floral Prayer Set)",
    subtitleBn: "কমফোর্ট প্রেয়ার কালেকশন",
    badge: "হট ডিল",
    price: 800,
    compareAtPrice: 850,
    image: "/niyamah/slider/slider-2-f.png",
    rating: 4.9,
    reviewsCount: 312,
  },
  {
    id: "tulip-package",
    category: "gift",
    nameBn: "টিউলিপ গিফট প্যাকেজ (Tulip Gift Package)",
    subtitleBn: "লাক্সারি হ্যান্ডব্যাগ ও উপহার সেট",
    badge: "লাক্সারি প্যাকেজ",
    price: 1225,
    compareAtPrice: 1350,
    image: "/niyamah/slider/slider-3-f.png",
    rating: 5.0,
    reviewsCount: 389,
  },
  {
    id: "medina-emerald",
    category: "hijab",
    nameBn: "প্রিমিয়াম মদিনা সিল্ক ওড়না — রয়েল বেরি",
    subtitleBn: "১০০% অপেক ও নন-স্লিপ সিল্ক",
    badge: "সর্বাধিক বিক্রীত",
    price: 1250,
    compareAtPrice: 1890,
    image: "/niyamah/editorial/hijab-drape.jpg",
    rating: 5.0,
    reviewsCount: 520,
  },
  {
    id: "tajweed-quran",
    category: "quran",
    nameBn: "কালার-কোডেড তাজবীদ কুরআন (১৫ লাইন)",
    subtitleBn: "স্বর্ণখচিত বাঁধাই ও সহজে পাঠযোগ্য",
    badge: "তাজবীদ সংস্করণ",
    price: 1450,
    compareAtPrice: 2200,
    image: "/niyamah/hero/hero-quran.png",
    rating: 5.0,
    reviewsCount: 467,
  },
  {
    id: "royal-gift-box",
    category: "gift",
    nameBn: "নিয়ামাহ্ রয়েল ইসলামিক গিফট বক্স",
    subtitleBn: "পূর্ণাঙ্গ উপহার প্যাকেজ",
    badge: "রেডি-টু-গিফট",
    price: 2450,
    compareAtPrice: 3500,
    image: "/niyamah/hero/hero-gift-box.png",
    rating: 5.0,
    reviewsCount: 341,
  },
];

const CATEGORIES = [
  { id: "all", labelBn: "সকল কালেকশন" },
  { id: "attar", labelBn: "খাঁটি আতর" },
  { id: "prayer", labelBn: "প্রেয়ার সেট" },
  { id: "gift", labelBn: "গিফট প্যাকেজ" },
  { id: "hijab", labelBn: "সিল্ক ওড়না" },
  { id: "quran", labelBn: "পবিত্র কুরআন" },
];

export function ProductDiscoverySection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredItems =
    activeTab === "all"
      ? CATALOG_ITEMS
      : CATALOG_ITEMS.filter((item) => item.category === activeTab);

  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="catalog"
      className="relative w-full bg-gradient-to-b from-[#1a070f] via-[#220914] to-[#18060e] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-[#d97d95]/10 blur-[140px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                নির্বাচিত সম্ভার • এক্সক্লুসিভ কালেকশন
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              বিশেষ অফারে প্রিমিয়াম কালেকশন, <br />
              <span className="italic text-[#e5c875]">হাতে বাছাইকৃত আভিজাত্য</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            প্রতিটি পণ্যে থাকছে সারা বাংলাদেশে ক্যাশ অন ডেলিভারির সুবিধা। পার্সেল খুলে যাচাই করে নিশ্চিন্তে মূল্য পরিশোধ করুন।
          </p>
        </div>

        {/* Category Tabs Bar */}
        <div className="mt-10 flex items-center gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] text-[#1a070f] font-bold shadow-lg scale-105"
                    : "border border-white/10 bg-white/[0.03] text-[#f8f1e3]/80 hover:border-[#d97d95]/50 hover:bg-[#340e1d]/40"
                }`}
              >
                <span>{tab.labelBn}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <motion.div layout className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_16px_35px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-[#d97d95]/70 hover:bg-[#320d1c]/50 hover:shadow-[0_24px_55px_rgba(217,125,149,0.22)]"
              >
                <div>
                  {/* Image Presentation */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d97d95]/5 to-black/60 pointer-events-none" />
                    <ImageWithFallback
                      src={item.image}
                      alt={item.nameBn}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 400px"
                      className="object-contain p-5 transition-transform duration-700 group-hover:scale-108 drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                    />
                    {item.badge && (
                      <div className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-md border border-[#e5c875]/40 px-3 py-1 text-[10px] font-mono font-medium tracking-wider text-[#e5c875] shadow-sm">
                        ✦ {item.badge}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 rounded-full bg-black/70 backdrop-blur-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-[#e5c875] shadow-sm">
                      ★ {item.rating.toFixed(1)}
                    </div>
                  </div>

                  {/* Product Metadata */}
                  <div className="mt-5">
                    <p className="text-[11px] font-mono text-[#d97d95]">
                      {item.subtitleBn}
                    </p>
                    <h3 className="font-serif text-lg font-medium text-[#f8f1e3] mt-1 line-clamp-1">
                      {item.nameBn}
                    </h3>
                  </div>
                </div>

                {/* Pricing & Order CTA */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-xl font-bold text-[#e5c875]">
                        ৳{item.price.toLocaleString("bn-BD")}
                      </span>
                      <del className="text-xs text-white/40">
                        ৳{item.compareAtPrice.toLocaleString("bn-BD")}
                      </del>
                    </div>
                    <p className="text-[10px] text-[#d97d95] font-semibold mt-0.5">
                      সাশ্রয় ৳{(item.compareAtPrice - item.price).toLocaleString("bn-BD")}
                    </p>
                  </div>

                  <a
                    href="#order-section"
                    onClick={handleScrollToOrder}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5c875] bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] px-4 text-xs font-semibold tracking-wider text-[#1a070f] shadow-md transition-all duration-300 hover:scale-105"
                  >
                    <span>অর্ডার করুন</span>
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
