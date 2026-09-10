"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface FabricOption {
  id: string;
  nameBn: string;
  subtitleBn: string;
  swatch: string;
  image: string;
  frontSize: string;
  backSize: string;
  fabricType: string;
  description: string;
  tag: string;
  price: string;
}

const FABRICS: FabricOption[] = [
  {
    id: "bexi-frill-pink",
    nameBn: "ফ্রিল করা সালাত হিজাব (গোলাপী ফ্লোরাল)",
    subtitleBn: "১০০% পিওর বেক্সি কটন ভয়েল",
    swatch: "#d97d95",
    image: "/niyamah/slider/slider-2-f.png",
    frontSize: "৪৩ ইঞ্চি",
    backSize: "৫২ ইঞ্চি",
    fabricType: "Pure bexi কটন",
    description:
      "নিচে কুচি দিয়ে চমৎকার ফ্রিল ডিজাইন করা। থুতনিতে আর মাথার কাছে রয়েছে আলাদা কাপড়, ফলে দুই সাইড থেকে কানের চুল কোনোভাবেই বের হবে না। নামাজে শতভাগ পর্দা ও আরাম নিশ্চিত।",
    tag: "সর্বাধিক জনপ্রিয় • বেস্টসেলার",
    price: "৳৮০০/-",
  },
  {
    id: "bexi-classic",
    nameBn: "পিওর বেক্সি কটন ক্লাসিক হিজাব",
    subtitleBn: "অরিজিনাল বেক্সি ভয়েল",
    swatch: "#e594a8",
    image: "/niyamah/slider/slider-2-f.png",
    frontSize: "৪৩ ইঞ্চি",
    backSize: "৫২ ইঞ্চি",
    fabricType: "Pure bexi কটন",
    description:
      "মাখনের মতো নরম ও বাতাস চলাচলকারী প্রিমিয়াম সুতি কাপড়। দীর্ঘক্ষণ নামাজে দাঁড়িয়ে বা সেজদায় থাকলেও মাথা থেকে পিছলে পড়ে না।",
    tag: "১০০% খাঁটি সুতি",
    price: "৳৮০০/-",
  },
  {
    id: "bexi-lace",
    nameBn: "ডাবল লেইস সালাত হিজাব",
    subtitleBn: "মার্জিত ফিনিশিং কালেকশন",
    swatch: "#c94b6d",
    image: "/niyamah/slider/slider-2-f.png",
    frontSize: "৪৩ ইঞ্চি",
    backSize: "৫২ ইঞ্চি",
    fabricType: "Pure bexi কটন",
    description:
      "আমাদের কাপড়ের কোয়ালিটি সবসময়ই বেস্ট হবে ইনশাআল্লাহ। নরম কটন ফ্যাব্রিক ও নিখুঁত সেলাই যা দীর্ঘ ব্যবহারে নতুনের মতো থাকে।",
    tag: "স্পেশাল এডিশন",
    price: "৳৮০০/-",
  },
  {
    id: "bexi-voile",
    nameBn: "প্রিমিয়াম বেক্সি ভয়েল হিজাব",
    subtitleBn: "নিউ কালেকশন ২০২৬",
    swatch: "#8c4456",
    image: "/niyamah/slider/slider-2-f.png",
    frontSize: "৪৩ ইঞ্চি",
    backSize: "৫২ ইঞ্চি",
    fabricType: "Pure bexi কটন",
    description:
      "দৈনন্দিন তাহাজ্জুদ, ফরজ নামাজ বা ইবাদতের জন্য সেরা চয়েস। সম্পূর্ণ ফ্রি সাইজ এবং যেকোনো বয়সের জন্য সহজে ব্যবহারযোগ্য।",
    tag: "নিউ কালেকশন",
    price: "৳৮০০/-",
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
                ইবাদতের স্নিগ্ধ প্রশান্তি • A Peaceful Prayer Moment
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              নামাজের হিজাব — Pure bexi কটন, <br />
              <span className="italic text-[#e5c875]">ইবাদতের প্রতিটি সেজদায় পরম স্বস্তি</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            ☑️ আমাদের কাপড়ের কোয়ালিটি সবসময়ই বেস্ট হবে ইনশাআল্লাহ। থুতনিতে ও মাথায় রয়েছে আলাদা কাপড়—দুই সাইড থেকে কানের চুল কখনোই বের হবে না। নামাজে পান শতভাগ পূর্ণাঙ্গ পর্দা ও কোমল অনুভূতি।
          </p>
        </div>

        {/* Interactive Fabric Explorer Stage */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Visual Portrait Window */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-[480px] overflow-hidden rounded-t-[200px] rounded-b-2xl border border-[#e5c875]/35 bg-black/60 shadow-[0_28px_70px_rgba(0,0,0,0.6)] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d97d95]/5 to-black/70 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFabric.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 h-full w-full flex items-center justify-center p-8"
                >
                  <Image
                    src={selectedFabric.image}
                    alt={selectedFabric.nameBn}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-contain p-6 drop-shadow-[0_20px_45px_rgba(0,0,0,0.7)]"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Inner Rim */}
              <div className="pointer-events-none absolute inset-2.5 rounded-t-[190px] rounded-b-xl border border-white/15" />

              {/* Badge Tag */}
              <div className="absolute top-6 right-6 backdrop-blur-md bg-black/75 border border-[#e5c875]/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-[#e5c875]">
                {selectedFabric.tag}
              </div>

              {/* Bottom Feature Card */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/80 border border-white/20 p-4 rounded-xl">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border-r border-white/15 pr-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">সামনের ঝুল</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#e5c875]">{selectedFabric.frontSize}</p>
                  </div>
                  <div className="border-r border-white/15 pr-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">পেছনের ঝুল</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#f8f1e3]">{selectedFabric.backSize}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/60">কাপড়ের মান</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#e5c875]">{selectedFabric.fabricType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fabric Switcher & Specifications */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#e5c875]">
                ডিজাইন ভ্যারিয়েশন নির্বাচন করুন
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <p className="text-xs font-semibold text-[#f8f1e3] line-clamp-1">
                            {fabric.nameBn}
                          </p>
                          <p className="text-[10px] text-[#e5c875]">
                            অফার: {fabric.price} <span className="text-white/40 line-through">৮৫০/-</span>
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#d97d95] flex items-center justify-center text-[#1a070f] shrink-0">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#e5c875]" />
                  <h3 className="font-serif text-xl font-medium text-[#f8f1e3]">
                    {selectedFabric.nameBn}
                  </h3>
                </div>
                <span className="font-serif text-xl font-bold text-[#e5c875]">
                  {selectedFabric.price}
                </span>
              </div>

              <p className="mt-3 text-sm text-[#f8f1e3]/85 leading-relaxed">
                {selectedFabric.description}
              </p>

              {/* Quality Checklist */}
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#e5c875]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c875]" />
                  <span>থুতনি ও মাথায় আলাদা কাপড়</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c875]" />
                  <span>কানের চুল বের হবে না</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c875]" />
                  <span>১০০% অরিজিনাল বেক্সি ভয়েল</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c875]" />
                  <span>নিচে কুচি দিয়ে ফ্রিল ডিজাইন</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 pt-5 border-t border-white/10">
                <a
                  href="#order-section"
                  onClick={handleScrollToOrder}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e5c875] bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] px-6 text-xs font-semibold tracking-wider text-[#1a070f] shadow-lg transition-transform hover:scale-105"
                >
                  <span>সালাত হিজাব অর্ডার করুন</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-2 text-xs text-[#f8f1e3]/75">
                  <ShieldCheck className="h-4 w-4 text-[#e5c875]" />
                  <span>পার্সেল দেখে ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
