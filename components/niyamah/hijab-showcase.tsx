"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

interface FabricOption {
  id: string;
  nameBn: string;
  subtitleBn: string;
  swatch: string;
  image: string;
  drapeScore: string;
  breathability: string;
  opacity: string;
  description: string;
  tag: string;
}

const FABRICS: FabricOption[] = [
  {
    id: "medina-silk",
    nameBn: "প্রিমিয়াম মদিনা সিল্ক",
    subtitleBn: "মদিনা সিল্ক কালেকশন",
    swatch: "#6b1d33",
    image: "/niyamah/editorial/hijab-drape.jpg",
    drapeScore: "৯.৯/১০ (ফ্লুইড ড্র্যাপ)",
    breathability: "উচ্চ বায়ু চলাচল",
    opacity: "১০০% অপেক (অস্বচ্ছ)",
    description:
      "মাখনের মতো মসৃণ ও অভিজাত শাইনযুক্ত তন্তু। এটি মাথা থেকে পিছলে পড়ে না এবং প্রতিটি ভাঁজে তৈরি করে অতুলনীয় মার্জিত সৌন্দর্য।",
    tag: "সর্বাধিক জনপ্রিয় • বেস্টসেলার",
  },
  {
    id: "bamboo-modal",
    nameBn: "ব্যাম্বু মোডাল",
    subtitleBn: "অর্গানিক ব্যাম্বু ফাইবার",
    swatch: "#8c4456",
    image: "/niyamah/editorial/hijab-drape.jpg",
    drapeScore: "৯.৬/১০ (সফট ড্র্যাপ)",
    breathability: "সর্বোচ্চ আরামদায়ক",
    opacity: "১০০% অপেক",
    description:
      "সম্পূর্ণ প্রাকৃতিক ব্যাম্বু ফাইবার থেকে তৈরি। গ্রীষ্ম ও আর্দ্র আবহাওয়ায় সারাদিন ব্যবহারে দেয় অবিশ্বাস্য শীতল ও আরামদায়ক অনুভূতি।",
    tag: "প্রাকৃতিক তন্তু • ১০০% অর্গানিক",
  },
  {
    id: "matte-chiffon",
    nameBn: "ম্যাট শিফন",
    subtitleBn: "ক্লাসিক ফর্মাল ফেব্রিক",
    swatch: "#3b141e",
    image: "/niyamah/editorial/hijab-drape.jpg",
    drapeScore: "৯.৪/১০ (লাইটওয়েট)",
    breathability: "হালকা ও বায়বীয়",
    opacity: "৯৮% অপেক",
    description:
      "যেকোনো উৎসব, বিয়ে বা বিশেষ দিনে মার্জিত উপস্থিতির জন্য নিখুঁত পছন্দ। নন-স্লিপ টেক্সচার ও দীর্ঘস্থায়ী স্থায়িত্বের প্রতিশ্রুতি।",
    tag: "বিশেষ দিনের জন্য • ফর্মাল চয়েস",
  },
  {
    id: "crinkle-crepe",
    nameBn: "ক্রিঙ্কল ক্রেপ",
    subtitleBn: "আয়রন-ফ্রি টেক্সচার",
    swatch: "#9d5267",
    image: "/niyamah/editorial/hijab-drape.jpg",
    drapeScore: "৯.৫/১০ (নন-স্লিপ)",
    breathability: "শ্বাসপ্রশ্বাসযোগ্য",
    opacity: "১০০% অপেক",
    description:
      "কোনো ধরনের আয়রনের প্রয়োজন নেই। ভ্রমণের সময় বা প্রতিদিনের ব্যস্ত রুটিনে সহজে পরে বের হয়ে যাওয়ার জন্য শ্রেষ্ঠ ফ্যাব্রিক।",
    tag: "আয়রন-ফ্রি • ডেইলি ইউজ",
  },
];

export function HijabShowcaseSection() {
  const [selectedFabric, setSelectedFabric] = useState<FabricOption>(FABRICS[0]!);

  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="fabric-guide"
      className="relative w-full bg-gradient-to-b from-[#1e0811] via-[#2a0c1a] to-[#18070e] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-[450px] w-[450px] rounded-full bg-[#d97d95]/12 blur-[140px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                মার্জিত শালীনতা • দ্য ভেইল অব গ্রেস
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              নিখুঁত ড্র্যাপ ও রাজকীয় কোমলতা, <br />
              <span className="italic text-[#e5c875]">সৌন্দর্য ও শালীনতার মেলবন্ধন</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            প্রতিটি ওড়নার বুনন ও তন্তু নিখুঁতভাবে বাছাইকৃত—যেন পর্দা হয় শতভাগ অপেক, মাখনের মতো নরম এবং দীর্ঘ ব্যবহারের পরেও মাথা থেকে পিছলে না পড়ে।
          </p>
        </div>

        {/* Interactive Fabric Explorer Stage */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Visual Portrait Window */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-[480px] overflow-hidden rounded-t-[200px] rounded-b-2xl border border-[#e5c875]/35 shadow-[0_28px_70px_rgba(0,0,0,0.6)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFabric.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 h-full w-full"
                >
                  <ImageWithFallback
                    src={selectedFabric.image}
                    alt={selectedFabric.nameBn}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Inner Rim */}
              <div className="pointer-events-none absolute inset-2.5 rounded-t-[190px] rounded-b-xl border border-white/20" />

              {/* Badge Tag */}
              <div className="absolute top-6 right-6 backdrop-blur-md bg-black/70 border border-[#e5c875]/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-[#e5c875]">
                {selectedFabric.tag}
              </div>

              {/* Bottom Feature Card */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/75 border border-white/20 p-4 rounded-xl">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border-r border-white/15 pr-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">ড্র্যাপ মান</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#e5c875]">{selectedFabric.drapeScore}</p>
                  </div>
                  <div className="border-r border-white/15 pr-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">বায়ু চলাচল</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#f8f1e3]">{selectedFabric.breathability}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">পর্দা মান</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#e5c875]">{selectedFabric.opacity}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fabric Switcher & Specifications */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#e5c875]">
                ফেব্রিক নির্বাচন করুন • পছন্দের ফেব্রিক দেখুন
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FABRICS.map((fabric) => {
                  const isSelected = fabric.id === selectedFabric.id;
                  return (
                    <button
                      key={fabric.id}
                      type="button"
                      onClick={() => setSelectedFabric(fabric)}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "border-[#d97d95] bg-[#340e1d]/70 shadow-lg scale-[1.02]"
                          : "border-white/10 bg-white/[0.03] hover:border-[#d97d95]/40 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-5 w-5 rounded-full border border-white/30 shrink-0"
                          style={{ backgroundColor: fabric.swatch }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#f8f1e3]">
                            {fabric.nameBn}
                          </p>
                          <p className="text-[10px] text-[#e5c875]/75">
                            {fabric.subtitleBn}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#d97d95] flex items-center justify-center text-[#1a070f]">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Fabric Deep Details */}
            <div className="mt-4 p-6 rounded-2xl border border-[#d97d95]/30 bg-white/[0.03] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#e5c875]" />
                <h3 className="font-serif text-xl font-medium text-[#f8f1e3]">
                  {selectedFabric.nameBn}
                </h3>
              </div>
              <p className="mt-3 text-sm text-[#f8f1e3]/80 leading-relaxed">
                {selectedFabric.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 pt-5 border-t border-white/10">
                <a
                  href="#order-section"
                  onClick={handleScrollToOrder}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e5c875] bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] px-6 text-xs font-semibold tracking-wider text-[#1a070f] shadow-lg transition-transform hover:scale-105"
                >
                  <span>কালেকশন অর্ডার করুন</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-2 text-xs text-[#f8f1e3]/75">
                  <ShieldCheck className="h-4 w-4 text-[#e5c875]" />
                  <span>ক্যাশ অন ডেলিভারিতে চেক করে পেমেন্ট</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
