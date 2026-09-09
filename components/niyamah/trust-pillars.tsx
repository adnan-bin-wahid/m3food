"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw, MessageSquare } from "lucide-react";

interface Pillar {
  id: string;
  icon: typeof ShieldCheck;
  titleBn: string;
  titleEn: string;
  desc: string;
  badge: string;
}

const PILLARS: Pillar[] = [
  {
    id: "p1",
    icon: ShieldCheck,
    titleBn: "১০০% খাঁটি ও পরীক্ষিত",
    titleEn: "100% Verified Quality",
    desc: "আমাদের প্রতিটি সিল্ক ওড়না, আতর এবং কুরআন শরিফ নিজস্ব তত্ত্বাবধানে বাছাই ও নিখুঁতভাবে মান যাচাইকৃত।",
    badge: "আর্টিসানাল মান",
  },
  {
    id: "p2",
    icon: Truck,
    titleBn: "ক্যাশ অন ডেলিভারি",
    titleEn: "Inspect at Doorstep (COD)",
    desc: "ডেলিভারি ম্যানের কাছ থেকে পার্সেল খুলে যাচাই করে নিশ্চিন্তে মূল্য পরিশোধ করুন। বাংলাদেশের সকল ৬৪ জেলায় প্রযোজ্য।",
    badge: "জিরো রিস্ক",
  },
  {
    id: "p3",
    icon: RotateCcw,
    titleBn: "৭ দিনের সহজ এক্সচেঞ্জ",
    titleEn: "7-Day Easy Exchange",
    desc: "পণ্য হাতে পাওয়ার পর সাইজ, কালার বা পছন্দজনিত কোনো কারণে সন্তুষ্ট না হলে ৭ দিনের মধ্যে পরিবর্তন করার নিশ্চয়তা।",
    badge: "নিশ্চিন্ত কেনাকাটা",
  },
  {
    id: "p4",
    icon: MessageSquare,
    titleBn: "ভিআইপি কনসিয়ার্জ সেবা",
    titleEn: "Dedicated VIP Support",
    desc: "সাইজ পরামর্শ, আতরের ঘ্রাণ চয়েস বা যেকোনো প্রশ্নের তাৎক্ষণিক উত্তর পেতে আমাদের WhatsApp ও হটলাইনে কল করুন।",
    badge: "সকাল ৯টা – রাত ১১টা",
  },
];

export function TrustPillarsSection() {
  return (
    <section
      id="trust"
      className="relative w-full bg-[#123d2a] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#c9a24d]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                কেন নিয়ামাহ্ আতায়ারস • The 4 Pillars of Excellence
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              আমাদের ৪টি মূল অঙ্গীকার, <br />
              <span className="italic text-[#c9a24d]">Trust In Every Step</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            অনলাইনে কেনাকাটায় আপনার শতভাগ সুরক্ষা ও মানসিক প্রশান্তি নিশ্চিত করাই আমাদের প্রধান দায়িত্ব।
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-all duration-300 hover:border-[#c9a24d]/60 hover:bg-white/[0.08]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-[#c9a24d]/15 border border-[#c9a24d]/30 flex items-center justify-center text-[#c9a24d]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#c9a24d] bg-[#c9a24d]/10 px-2.5 py-1 rounded-full">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-[#f8f1e3] mt-6">
                    {pillar.titleBn}
                  </h3>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#c9a24d] mt-1">
                    {pillar.titleEn}
                  </p>

                  <p className="mt-3 text-xs text-[#f8f1e3]/75 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#f8f1e3]/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24d]" />
                  <span>গ্রাহক সুরক্ষায় ১০০% দায়বদ্ধ</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
