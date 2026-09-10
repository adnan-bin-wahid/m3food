"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Heart, Feather } from "lucide-react";
import Image from "next/image";

export function BrandStorySection() {
  return (
    <section
      id="story"
      className="relative w-full bg-gradient-to-b from-[#1c0811] via-[#240a16] to-[#1a070f] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      {/* Ambient luxury lighting */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-[#d97d95]/12 blur-[130px]" />
      <div className="pointer-events-none absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-[#e5c875]/10 blur-[130px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                আমাদের দর্শন ও বিশেষত্ব • আভিজাত্যের শিল্পকথা
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              প্রতিটি হিজাবে শালীনতার ছোঁয়া, <br />
              <span className="italic text-[#e5c875]">প্রতিটি সুবাসে পবিত্র প্রশান্তি</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            নিয়ামাহ্-র প্রতিটি পণ্য তৈরি হয় অত্যন্ত যত্ন ও নিখুঁত ফিনিশিংয়ে। ১০০% অরিজিনাল বেক্সি ভয়েল কটন হিজাব ও নন-অ্যালকোহলিক সুবাসের মেলবন্ধনে ইবাদতে এনে দেয় পরম আরাম ও প্রশান্তি।
          </p>
        </div>

        {/* 2-Column Asymmetrical Atelier Showcase */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Real Product Visual Vignette with Arched Frame */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative flex justify-center"
          >
            <div className="relative aspect-[4/5] w-full max-w-[480px] overflow-hidden rounded-t-[220px] rounded-b-2xl border border-[#e5c875]/35 bg-black/50 shadow-[0_32px_75px_rgba(0,0,0,0.6)] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d97d95]/5 to-black/70 pointer-events-none" />
              <Image
                src="/niyamah/slider/slider-3-f.png"
                alt="টিউলিপ প্যাকেজ — সালাত হিজাব, পারফিউম ও গিফট ব্যাগ"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-contain p-8 transition-transform duration-1000 hover:scale-105 drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
              />
              <div className="pointer-events-none absolute inset-3 rounded-t-[210px] rounded-b-xl border border-white/15" />
              
              {/* Floating Craftsmanship Seal */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/75 border border-[#e5c875]/35 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#e5c875]/20 border border-[#e5c875]/40 flex items-center justify-center text-[#e5c875]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white tracking-wide">
                      ১০০% অরিজিনাল বেক্সি ভয়েল ও খাঁটি সুবাস
                    </p>
                    <p className="text-[11px] text-[#e5c875]/80">
                      আমাদের কাপড়ের কোয়ালিটি সবসময়ই বেস্ট ইনশাআল্লাহ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 3 Pillar Narratives */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-[#d97d95]/50 hover:bg-[#340e1d]/40 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-[#d97d95]/20 border border-[#d97d95]/35 flex items-center justify-center text-[#e5c875]">
                  <Feather className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ১. নামাজের হিজাব (Pure Bexi Cotton)
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    নিচে কুচি দিয়ে ফ্রিল ডিজাইন করা ১০০% অরিজিনাল বেক্সি ভয়েল হিজাব। থুতনিতে আর মাথার কাছে রয়েছে আলাদা কাপড়, ফলে দুই সাইড থেকে কানের চুল বের হবে না। ফ্রি সাইজ: ফ্রন্ট ৪৩ ইঞ্চি, পেছনে ৫২ ইঞ্চি।
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-[#d97d95]/50 hover:bg-[#340e1d]/40 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-[#d97d95]/20 border border-[#d97d95]/35 flex items-center justify-center text-[#e5c875]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ২. নন আলকোহলিক পারফিউম
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    শতভাগ অ্যালকোহল মুক্ত প্রাকৃতিক পারফিউম। নামাজ ও দৈনন্দিন ব্যবহারে দীর্ঘ সময় ধরে রাখে স্নিগ্ধ ও পবিত্র সুবাস। রেগুলার ১০৫০/-, আজকের বিশেষ অফারে কেবল ৮৫০/-।
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-[#d97d95]/50 hover:bg-[#340e1d]/40 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-[#d97d95]/20 border border-[#d97d95]/35 flex items-center justify-center text-[#e5c875]">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ৩. সম্পূর্ণ টিউলিপ গিফট প্যাকেজ
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    প্রিমিয়াম bexi কটন সালাত হিজাব + নন আলকোহলিক পারফিউম + সুপার কিউট টিউলিপ গিফট ব্যাগ। নিজেকে বা প্রিয়জনকে উপহার দেওয়ার সেরা প্যাকেজ মাত্র ১২২৫/- (রেগুলার ১৩৫০/-)।
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
