"use client";

import { motion } from "framer-motion";
import { Sparkles, Droplets, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";

export function AttarShowcaseSection() {
  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="fragrance-notes"
      className="relative w-full bg-gradient-to-b from-[#18070e] via-[#240a15] to-[#1a070f] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      {/* Warm amber & berry ambient glow */}
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-[#d97d95]/12 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-80 w-80 rounded-full bg-[#e5c875]/10 blur-[120px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                নন আলকোহলিক পারফিউম • ১০০% বিশুদ্ধ সুবাস
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              নন আলকোহলিক পারফিউম, <br />
              <span className="italic text-[#e5c875]">মনোমুগ্ধকর স্নিগ্ধ দীর্ঘস্থায়ী সুবাস</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            রেগুলার ১০৫০/-, আজকের স্পেশাল অফারে সংগ্রহ করুন মাত্র ৮৫০/-। ১০০% অ্যালকোহল মুক্ত প্রাকৃতিক পারফিউম যা নামাজ ও দৈনন্দিন জীবনে দেয় অনন্য প্রশান্তি।
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: The Fragrance Notes Pyramid */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <Droplets className="h-5 w-5 text-[#e5c875]" />
                <h3 className="font-serif text-xl font-medium text-[#f8f1e3]">
                  সুগন্ধির নোটস ও সুরভিত বৈশিষ্ট্য
                </h3>
              </div>

              {/* Note 1: Top Notes */}
              <div className="mb-5 pb-5 border-b border-white/8">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-[#e5c875]">
                    ১. টপ নোটস (Top Notes)
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">প্রথম ০–১৫ মিনিট</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  স্নিগ্ধ অর্কিড ও তাজা ফুলের প্রথম স্পন্দন
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  ব্যবহারের সাথে সাথেই মনকে সতেজ ও প্রফুল্ল করে তোলে।
                </p>
              </div>

              {/* Note 2: Heart Notes */}
              <div className="mb-5 pb-5 border-b border-white/8">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-[#e5c875]">
                    ২. হৃদয়ের মিষ্টি সুবাস (Heart Notes)
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">২–৬ ঘণ্টা স্থায়ী</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  গোলাপী পাপড়ি ও ভ্যানিলার স্নিগ্ধ আবেশ
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  কোমল ও মিষ্টি ফুলের এক মোহনীয় রাজকীয় অনুভূতি।
                </p>
              </div>

              {/* Note 3: Base Notes */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-[#e5c875]">
                    ৩. দীর্ঘস্থায়ী ভিত্তি (Base Notes)
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">১৬+ ঘণ্টা স্থায়ী</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  উষ্ণ হোয়াইট মাস্ক ও মিষ্টি অ্যাম্বার
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  কাপড়ে ও ত্বকে সারাদিন স্নিগ্ধ সুবাস ধরে রাখে।
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 text-[#e5c875]">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">স্থায়িত্ব</span>
                </div>
                <p className="mt-1 text-base font-semibold text-[#f8f1e3]">১৬+ ঘণ্টা নিশ্চিত</p>
                <p className="text-[11px] text-[#f8f1e3]/60">দীর্ঘস্থায়ী তেলের সিয়াম</p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 text-[#e5c875]">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">বিশুদ্ধতা</span>
                </div>
                <p className="mt-1 text-base font-semibold text-[#f8f1e3]">১০০% অ্যালকোহল মুক্ত</p>
                <p className="text-[11px] text-[#f8f1e3]/60">নামাজের জন্য সম্পূর্ণ হালাল</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Stage with Arched Bottle Silhouette */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-t-[200px] rounded-b-2xl border border-[#e5c875]/40 bg-black/60 shadow-[0_32px_75px_rgba(0,0,0,0.65)] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d97d95]/5 to-black/70 pointer-events-none" />
              
              <Image
                src="/niyamah/slider/slider-1-f.png"
                alt="নন আলকোহলিক পারফিউম — Orchid Perfume"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 460px"
                className="object-contain p-6 transition-transform duration-1000 hover:scale-105 drop-shadow-[0_20px_45px_rgba(0,0,0,0.7)]"
              />
              <div className="pointer-events-none absolute inset-2.5 rounded-t-[190px] rounded-b-xl border border-white/15" />

              {/* Action Floating CTA */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/80 border border-[#e5c875]/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    নন আলকোহলিক পারফিউম
                  </p>
                  <p className="text-[11px] text-[#e5c875]">
                    অফার: ৳৮৫০/- <span className="text-white/40 line-through">৳১০৫০/-</span>
                  </p>
                </div>
                <a
                  href="#order-section"
                  onClick={handleScrollToOrder}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] px-4 text-xs font-semibold tracking-wider text-[#1a070f] shadow-md transition-transform hover:scale-105"
                >
                  <span>অর্ডার করুন</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
