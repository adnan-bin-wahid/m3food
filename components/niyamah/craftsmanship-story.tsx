"use client";

import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Shield, Scissors, Eye, Gift } from "lucide-react";
import Image from "next/image";

interface Step {
  num: string;
  titleBn: string;
  subtitleEn: string;
  desc: string;
  tag: string;
  icon: typeof Scissors;
}

const CRAFT_STEPS: Step[] = [
  {
    num: "০১",
    titleBn: "উপাদান নির্বাচন ও তন্তুর বিশুদ্ধতা",
    subtitleEn: "Artisanal Material Sourcing",
    desc: "শতভাগ অর্জিনাল বেক্সি ভয়েল কটন ফেব্রিক বাছাই, যা অত্যন্ত কোমল, বাতাস চলাচলযোগ্য এবং প্রাকৃতিক। কোনো কৃত্রিম পলিয়েস্টার শিরিং ছাড়া তৈরি।",
    tag: "১০০% পিওর কটন",
    icon: Scissors,
  },
  {
    num: "০২",
    titleBn: "ভাবনাময় নকশা ও চুল সুরক্ষা শিল্ড",
    subtitleEn: "Thoughtful Engineering & Shield",
    desc: "থুতনিতে আর মাথার কাছে বিশেষ আলাদা কাপড় যুক্ত করা হয়েছে, ফলে দুই সাইড থেকে কানের চুল কোনোভাবেই বের হয় না। নামাজে শতভাগ পূর্ণাঙ্গ পর্দা নিশ্চিত।",
    tag: "কানের চুল বের হবে না",
    icon: Shield,
  },
  {
    num: "০৩",
    titleBn: "নিখুঁত ফ্রিল কুচি ও মান যাচাই",
    subtitleEn: "Pleated Frill Craft & QA",
    desc: "প্রতিটি সালাত হিজাবের নিচের কুচি ও নিখুঁত সেলাই নিজস্ব তত্ত্বাবধানে একাধিকবার পরীক্ষা করা হয়। প্রতিটি পিস যেন পায় সর্বোচ্চ ফিনিশিং।",
    tag: "নিজস্ব তত্ত্বাবধানে তৈরি",
    icon: Eye,
  },
  {
    num: "০৪",
    titleBn: "রাজকীয় সুবাসিত উপহারের রূপ",
    subtitleEn: "Luxury Presentation & Gifting",
    desc: "অ্যালকোহল মুক্ত খাঁটি অর্কিড পারফিউম এবং আকর্ষণীয় টিউলিপ হ্যান্ডব্যাগে পরম যত্নে সুবাসিত ও সুরক্ষিতভাবে প্রস্তুত করা হয় প্রতিটি পার্সেল।",
    tag: "রেডি-টু-গিফট",
    icon: Gift,
  },
];

export function CraftsmanshipSection() {
  return (
    <section
      id="craftsmanship"
      className="relative w-full bg-gradient-to-b from-[#18070e] via-[#220914] to-[#1a070f] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-[#d97d95]/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-10 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[#e5c875]/8 blur-[130px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                ক্রাফটসম্যানশিপ স্টোরি • The Art Behind Every Detail
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              প্রতিটি সুতোর পেছনে <br />
              <span className="italic text-[#e5c875]">নিখুঁত যত্নের কারুশিল্প</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            নিয়ামাহ্ কোনো সাধারণ গণ-উৎপাদনের পণ্য নয়। প্রতিটি হিজাবের সুতো থেকে শুরু করে কুচির ভাঁজ পর্যন্ত রয়েছে আমাদের অক্লান্ত ভালোবাসা ও আভিজাত্যের ছোঁয়া।
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Fabric & Cutout Presentation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[4/5] w-full rounded-3xl border border-[#d97d95]/35 bg-gradient-to-b from-[#2e0c1b]/80 via-[#220814]/90 to-[#16050d] p-6 sm:p-8 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between group">
              {/* Top Bar Badges */}
              <div className="flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5c875]/15 border border-[#e5c875]/40 px-3.5 py-1 text-xs font-mono font-semibold text-[#e5c875]">
                  <Sparkles className="h-3.5 w-3.5" />
                  আর্টিসানাল ফিনিশিং
                </span>
                <span className="rounded-full bg-black/60 border border-white/10 px-3 py-1 text-xs font-mono text-[#d97d95]">
                  Pure bexi কটন
                </span>
              </div>

              {/* Central Cutout */}
              <div className="relative flex-1 w-full flex items-center justify-center my-4">
                <div className="relative h-full w-full max-h-[360px]">
                  <Image
                    src="/niyamah/slider/slider-2-f.png"
                    alt="নিয়ামাহ্ কারুশিল্প ও বেক্সি কটন হিজাব"
                    fill
                    sizes="(max-width: 768px) 90vw, 450px"
                    className="object-contain p-2 transform group-hover:scale-106 transition-transform duration-700 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                  />
                </div>
              </div>

              {/* Bottom Details Overlay */}
              <div className="z-10 pt-4 border-t border-white/10">
                <p className="text-xs font-serif italic text-[#e5c875]">
                  “আমাদের কাপড়ের কোয়ালিটি সবসময়ই বেস্ট হবে ইনশাআল্লাহ.. থুতনিতে আর মাথার কাছে আলাদা কাপড়, দুই সাইড থেকে কানের চুল কখনোই বের হবে না।”
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-white/60">
                  <span>সাইজ: ফ্রন্ট ৪৩″ • পেছনে ৫২″</span>
                  <span className="text-[#d97d95]">নিচে কুচি ফ্রিল</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 4-Step Timeline */}
          <div className="lg:col-span-7 space-y-4">
            {CRAFT_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: idx * 0.14 }}
                  className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-[#d97d95]/50 hover:bg-[#320d1c]/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-[#e5c875]/10 border border-[#e5c875]/30 flex items-center justify-center shrink-0 text-[#e5c875] group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#e5c875]">
                            {step.num}
                          </span>
                          <h3 className="font-serif text-lg font-medium text-[#f8f1e3]">
                            {step.titleBn}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#e5c875] bg-[#e5c875]/10 border border-[#e5c875]/30 px-2.5 py-0.5 rounded-full">
                          {step.tag}
                        </span>
                      </div>

                      <p className="text-xs font-mono text-[#d97d95] mb-2 uppercase tracking-wider">
                        {step.subtitleEn}
                      </p>

                      <p className="text-xs sm:text-sm text-[#f8f1e3]/75 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
