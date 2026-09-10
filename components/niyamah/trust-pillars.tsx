"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw, MessageSquare } from "lucide-react";

interface Pillar {
  id: string;
  icon: typeof ShieldCheck;
  titleBn: string;
  subtitleBn: string;
  desc: string;
  badge: string;
}

const PILLARS: Pillar[] = [
  {
    id: "p1",
    icon: ShieldCheck,
    titleBn: "১০০% খাঁটি ও পরীক্ষিত মান",
    subtitleBn: "আর্টিসানাল প্রিমিয়াম কোয়ালিটি",
    desc: "আমাদের প্রতিটি প্রেয়ার সেট, আতর এবং সিল্ক ওড়না নিজস্ব তত্ত্বাবধানে বাছাই ও নিখুঁতভাবে মান যাচাইকৃত।",
    badge: "প্রিমিয়াম মান",
  },
  {
    id: "p2",
    icon: Truck,
    titleBn: "ক্যাশ অন ডেলিভারি (COD)",
    subtitleBn: "পার্সেল দেখে নেওয়ার পূর্ণ সুবিধা",
    desc: "ডেলিভারি ম্যানের সামনে পার্সেল খুলে যাচাই করে নিশ্চিন্তে মূল্য পরিশোধ করুন। বাংলাদেশের সকল ৬৪ জেলায় প্রযোজ্য।",
    badge: "জিরো রিস্ক",
  },
  {
    id: "p3",
    icon: RotateCcw,
    titleBn: "৭ দিনের সহজ এক্সচেঞ্জ",
    subtitleBn: "সম্মানজনক ও ঝামেলাহীন পরিবর্তন",
    desc: "পণ্য হাতে পাওয়ার পর সাইজ, কালার বা পছন্দজনিত কোনো কারণে সন্তুষ্ট না হলে ৭ দিনের মধ্যে পরিবর্তন করার নিশ্চয়তা।",
    badge: "নিশ্চিন্ত কেনাকাটা",
  },
  {
    id: "p4",
    icon: MessageSquare,
    titleBn: "ভিআইপি কনসিয়ার্জ সেবা",
    subtitleBn: "ব্যক্তিগত পরামর্শ ও সার্বক্ষণিক সহায়তা",
    desc: "সাইজ পরামর্শ, উপহার চয়েস বা যেকোনো প্রশ্নের তাৎক্ষণিক উত্তর পেতে আমাদের হটলাইন ও মেসেঞ্জারে যোগাযোগ করুন।",
    badge: "সকাল ৯টা – রাত ১১টা",
  },
];

export function TrustPillarsSection() {
  return (
    <section
      id="trust"
      className="relative w-full bg-gradient-to-b from-[#1e0811] via-[#280c18] to-[#1a070f] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                কেন নিয়ামাহ্ আতায়ারস • বিশ্বস্ততার ৪টি স্তম্ভ
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              আমাদের ৪টি মূল অঙ্গীকার, <br />
              <span className="italic text-[#e5c875]">প্রতিটি ধাপে আপনার পূর্ণ আস্থা</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            অনলাইনে কেনাকাটায় আপনার শতভাগ সুরক্ষা, পণ্যের খাঁটি মান ও মানসিক প্রশান্তি নিশ্চিত করাই আমাদের প্রধান দায়িত্ব।
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
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-[#d97d95]/60 hover:bg-[#340e1d]/40 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-[#d97d95]/20 border border-[#d97d95]/35 flex items-center justify-center text-[#e5c875]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider text-[#e5c875] bg-[#e5c875]/10 border border-[#e5c875]/20 px-2.5 py-1 rounded-full">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-[#f8f1e3] mt-6">
                    {pillar.titleBn}
                  </h3>
                  <p className="text-xs text-[#d97d95] mt-1">
                    {pillar.subtitleBn}
                  </p>

                  <p className="mt-3 text-xs text-[#f8f1e3]/75 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#f8f1e3]/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e5c875]" />
                  <span>গ্রাহক সুরক্ষায় শতভাগ দায়বদ্ধ</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
