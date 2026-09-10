"use client";

import { motion } from "framer-motion";
import { Gift, Sparkles, Heart, Check, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import Image from "next/image";

export function TulipShowcaseSection() {
  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const packageIncludes = [
    {
      title: "প্রিমিয়াম bexi কটন সালাত হিজাব",
      desc: "১০০% অর্জিনাল বেক্সি ভয়েল কটন, নিচে কুচি দিয়ে ফ্রিল ডিজাইন এবং থুতনি ও মাথায় আলাদা কাপড় যাতে চুল বের না হয়।",
      badge: "Pure bexi কটন",
    },
    {
      title: "নন আলকোহলিক পারফিউম",
      desc: "১০০% অ্যালকোহল মুক্ত প্রাকৃতিক অর্কিড ফ্লোরাল সুবাস। চামড়া ও কাপড়ে দীর্ঘস্থায়ী স্নিগ্ধ প্রশান্তিময় সুবাস।",
      badge: "১০০% হালাল সুবাস",
    },
    {
      title: "সুপার কিউট টিউলিপ গিফট ব্যাগ",
      desc: "আভিজাত্যপূর্ণ ডিজাইনের লাক্সারি হ্যান্ডব্যাগ, যা উপহারের মর্যাদা বহুগুণ বাড়িয়ে দেয় এবং দৈনন্দিন ব্যবহারের উপযোগী।",
      badge: "এক্সক্লুসিভ উপহার",
    },
  ];

  return (
    <section
      id="tulip-package"
      className="relative w-full bg-gradient-to-b from-[#1a070f] via-[#280d19] to-[#18070e] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      {/* Rose-gold and Champagne atmospheric radial glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-[550px] w-[550px] rounded-full bg-[#d97d95]/12 blur-[150px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-[450px] w-[450px] rounded-full bg-[#e5c875]/10 blur-[140px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                প্রিয়জনকে ভালোবাসার শ্রেষ্ঠ হাদিয়া • A Meaningful Gift for Someone Special
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              টিউলিপ প্যাকেজ, <br />
              <span className="italic text-[#e5c875]">ভালোবাসা ও কৃতজ্ঞতার চিরন্তন উপহার</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            মা, বোন, স্ত্রী বা প্রিয়জনকে উপহার দেওয়ার শ্রেষ্ঠ সমন্বয়। প্রিমিয়াম বেক্সি কটন সালাত হিজাব, অ্যালকোহল মুক্ত মন মাতানো সুবাস ও আকর্ষণীয় টিউলিপ ব্যাগ—এক প্যাকেজেই ভালোবাসার পূর্ণ প্রকাশ।
          </p>
        </div>

        {/* Content Layout */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Arched Pedestal Visual */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-3xl border border-[#d97d95]/35 bg-gradient-to-b from-[#340f1f]/80 via-[#260a16]/90 to-[#19060f] p-6 sm:p-8 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between group">
              {/* Top Bar Badges */}
              <div className="flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5c875]/15 border border-[#e5c875]/40 px-3.5 py-1 text-xs font-mono font-semibold text-[#e5c875] backdrop-blur-md">
                  <Gift className="h-3.5 w-3.5" />
                  রেডি-টু-গিফট
                </span>
                <span className="rounded-full bg-black/60 border border-white/10 px-3 py-1 text-xs font-mono text-[#d97d95]">
                  সাশ্রয় ৳১২৫/-
                </span>
              </div>

              {/* Central Cutout */}
              <div className="relative flex-1 w-full flex items-center justify-center my-4">
                <div className="relative h-full w-full max-h-[380px]">
                  <Image
                    src="/niyamah/slider/slider-3-f.png"
                    alt="টিউলিপ প্যাকেজ — পূর্ণাঙ্গ উপহার সেট"
                    fill
                    sizes="(max-width: 768px) 90vw, 550px"
                    className="object-contain p-2 transform group-hover:scale-106 transition-transform duration-700 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                  />
                </div>
              </div>

              {/* Bottom Details Overlay */}
              <div className="z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#e5c875] tracking-widest block">
                    প্যাকেজ অফার মূল্য
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#f8f1e3]">
                      ৳১,২২৫/-
                    </span>
                    <del className="text-white/45 text-sm font-mono">
                      ৳১,৩৫০/-
                    </del>
                  </div>
                </div>
                <a
                  href="#order-section"
                  onClick={handleScrollToOrder}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5c875] bg-gradient-to-r from-[#d97d95] via-[#e594a8] to-[#c94b6d] px-5 py-2.5 text-xs font-bold tracking-wider text-[#1a070f] shadow-lg hover:scale-105 transition-all"
                >
                  <span>অর্ডার করুন</span>
                  <ShoppingBag className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Package Breakdown & Features */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#d97d95]">
                প্যাকেজে যা যা অন্তর্ভুক্ত থাকছে
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#f8f1e3] mt-2">
                ৩টি প্রিমিয়াম উপহারের এক রাজকীয় কম্বিনেশন
              </h3>
            </div>

            {/* 3 Component Cards */}
            <div className="space-y-4">
              {packageIncludes.map((item, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#d97d95]/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-serif text-base font-semibold text-[#f8f1e3] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#e5c875]" />
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-[#e5c875] bg-[#e5c875]/10 border border-[#e5c875]/30 px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#f8f1e3]/75 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust Assurance Strip */}
            <div className="p-4 rounded-xl border border-[#e5c875]/25 bg-black/40 flex items-center justify-between gap-4 text-xs font-mono text-[#e5c875]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#e5c875]" />
                <span>দেখে পেমেন্ট (COD) • সারা দেশে দ্রুত ডেলিভারি</span>
              </div>
              <a
                href="#order-section"
                onClick={handleScrollToOrder}
                className="shrink-0 underline hover:text-white transition-colors"
              >
                এখনই নিন →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
