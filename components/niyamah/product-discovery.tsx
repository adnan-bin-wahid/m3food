"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles, ArrowRight, Check } from "lucide-react";
import Link from "./reference-link";
import { ImageWithFallback } from "./image-with-fallback";

interface CatalogItem {
  id: string;
  category: string;
  nameBn: string;
  nameEn: string;
  badge?: string;
  price: number;
  compareAtPrice: number;
  image: string;
  rating: number;
  reviewsCount: number;
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "medina-emerald",
    category: "hijab",
    nameBn: "প্রিমিয়াম মদিনা সিল্ক ওড়না — এমারেল্ড",
    nameEn: "Medina Silk Hijab • Emerald",
    badge: "সর্বাধিক বিক্রীত",
    price: 1250,
    compareAtPrice: 1890,
    image: "/niyamah/editorial/hijab-drape.jpg",
    rating: 5.0,
    reviewsCount: 382,
  },
  {
    id: "tajweed-quran",
    category: "quran",
    nameBn: "কালার-কোডেড তাজবীদ কুরআন (১৫ লাইন)",
    nameEn: "Color-Coded Tajweed Quran",
    badge: "তাজবীদ সংস্করণ",
    price: 1450,
    compareAtPrice: 2200,
    image: "/niyamah/hero/hero-quran.png",
    rating: 5.0,
    reviewsCount: 512,
  },
  {
    id: "oud-cambodian",
    category: "attar",
    nameBn: "কম্বোডিয়ান খাঁটি উদ আতর (৬ মিলি)",
    nameEn: "Cambodian Pure Oud Extrait",
    badge: "১৬+ ঘণ্টা স্থায়িত্ব",
    price: 1650,
    compareAtPrice: 2450,
    image: "/niyamah/editorial/perfume-flacon.jpg",
    rating: 4.9,
    reviewsCount: 224,
  },
  {
    id: "royal-gift-box",
    category: "gift",
    nameBn: "নিয়ামাহ্ রয়েল ইসলামিক গিফট বক্স",
    nameEn: "Royal Keepsake Islamic Gift Box",
    badge: "রেডি-টু-গিফট",
    price: 2450,
    compareAtPrice: 3500,
    image: "/niyamah/hero/hero-gift-box.png",
    rating: 5.0,
    reviewsCount: 419,
  },
  {
    id: "prayer-mat-velvet",
    category: "prayer",
    nameBn: "মেমোরি ফোম ভেলভেট জায়নামাজ ও তাসবিহ",
    nameEn: "Memory Foam Prayer Mat Set",
    badge: "অর্থোপেডিক কুশনিং",
    price: 1350,
    compareAtPrice: 1950,
    image: "/niyamah/hero/hero-prayer-mat.png",
    rating: 4.9,
    reviewsCount: 195,
  },
  {
    id: "medina-noir",
    category: "hijab",
    nameBn: "মদিনa সিল্ক ওড়না — রয়েল ব্লাক",
    nameEn: "Medina Silk Hijab • Royal Noir",
    badge: "ক্লাসিক কালেকশন",
    price: 1250,
    compareAtPrice: 1890,
    image: "/niyamah/editorial/hijab-drape.jpg",
    rating: 4.9,
    reviewsCount: 278,
  },
];

const CATEGORIES = [
  { id: "all", labelBn: "সকল পণ্য", labelEn: "All Items" },
  { id: "hijab", labelBn: "সিল্ক ওড়না", labelEn: "Medina Silk" },
  { id: "attar", labelBn: "খাঁটি আতর", labelEn: "Pure Attars" },
  { id: "quran", labelBn: "পবিত্র কুরআন", labelEn: "Sacred Quran" },
  { id: "gift", labelBn: "গিফট ও উপহার", labelEn: "Gift Sets" },
  { id: "prayer", labelBn: "জায়নামাজ", labelEn: "Prayer Mats" },
];

export function ProductDiscoverySection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredItems =
    activeTab === "all"
      ? CATALOG_ITEMS
      : CATALOG_ITEMS.filter((item) => item.category === activeTab);

  return (
    <section
      id="catalog"
      className="relative w-full bg-[#f8f1e3] text-[#123d2a] py-24 sm:py-32 overflow-hidden border-t border-[#123d2a]/10"
    >
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#123d2a]/15">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                নির্বাচিত সম্ভার • Curated Discovery
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#123d2a]">
              বিশেষ অফারে প্রিমিয়াম কালেকশন, <br />
              <span className="italic text-[#c9a24d]">Handpicked With Grace</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#123d2a]/70">
            প্রতিটি পণ্যে থাকছে সারা বাংলাদেশে ক্যাশ অন ডেলিভারির সুবিধা। পার্সেল খুলে যাচাই করে নিশ্চিন্তে মূল্য পরিশোধ করুন।
          </p>
        </div>

        {/* Category Tabs Bar */}
        <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "bg-[#123d2a] text-[#f8f1e3] shadow-md scale-105"
                    : "border border-[#123d2a]/15 bg-white/60 text-[#123d2a] hover:bg-white hover:border-[#c9a24d]"
                }`}
              >
                <span>{tab.labelBn}</span>
                <span className="text-[10px] opacity-60 font-mono">({tab.labelEn})</span>
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
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#123d2a]/12 bg-white/80 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#c9a24d] hover:shadow-[0_20px_45px_rgba(201,162,77,0.16)]"
              >
                <div>
                  {/* Image Presentation */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#123d2a]/5">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.nameBn}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 400px"
                      className="object-contain p-4 transition-transform duration-700 group-hover:scale-108"
                    />
                    {item.badge && (
                      <div className="absolute top-3 left-3 rounded-full bg-[#123d2a] px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#c9a24d] shadow-sm">
                        ✦ {item.badge}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-[#123d2a] shadow-sm">
                      ★ {item.rating.toFixed(1)}
                    </div>
                  </div>

                  {/* Product Metadata */}
                  <div className="mt-5">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#c9a24d]">
                      {item.nameEn}
                    </p>
                    <h3 className="font-serif text-lg font-medium text-[#123d2a] mt-1 line-clamp-1">
                      {item.nameBn}
                    </h3>
                  </div>
                </div>

                {/* Pricing & Order CTA */}
                <div className="mt-6 pt-4 border-t border-[#123d2a]/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-xl font-bold text-[#123d2a]">
                        ৳{item.price.toLocaleString("bn-BD")}
                      </span>
                      <del className="text-xs text-[#123d2a]/45">
                        ৳{item.compareAtPrice.toLocaleString("bn-BD")}
                      </del>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      সাশ্রয় ৳{(item.compareAtPrice - item.price).toLocaleString("bn-BD")}
                    </p>
                  </div>

                  <a
                    href="#order-section"
                    className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-[#c9a24d] bg-[#123d2a] px-4 text-xs font-semibold uppercase tracking-wider text-[#f8f1e3] shadow-md transition-all duration-300 hover:bg-[#c9a24d] hover:text-[#123d2a]"
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
