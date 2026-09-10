"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Compass, Feather } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

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
                আমাদের দর্শন ও ঐতিহ্য • আভিজাত্যের শিল্পকথা
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              প্রতিটি সুতোয় শালীনতার ছোঁয়া, <br />
              <span className="italic text-[#e5c875]">প্রতিটি সুবাসে আত্মিক প্রশান্তি</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            নিয়ামাহ্ কেবল একটি সাধারণ ব্র্যান্ড নয়; এটি মার্জিত পর্দা, নিখুঁত আত্মমর্যাদা এবং আধ্যাত্মিক সুবাসের এক অনন্য রাজকীয় মেলবন্ধন। প্রতিটি সুতো আর ড্র্যাপে রচিত হয় আত্মবিশ্বাসের এক নতুন গল্প।
          </p>
        </div>

        {/* 2-Column Asymmetrical Atelier Showcase */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Vignette with Arched Frame */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative flex justify-center"
          >
            <div className="relative aspect-[4/5] w-full max-w-[500px] overflow-hidden rounded-t-[220px] rounded-b-2xl border border-[#e5c875]/35 shadow-[0_32px_75px_rgba(0,0,0,0.55)]">
              <ImageWithFallback
                src="/niyamah/editorial/brand-craft.jpg"
                alt="নিয়ামাহ্ প্রিমিয়াম কারুকাজ ও খাঁটি উপাদানের প্রতিশ্রুতি"
                fill
                sizes="(max-width: 1024px) 90vw, 500px"
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-3 rounded-t-[210px] rounded-b-xl border border-white/20" />
              
              {/* Floating Craftsmanship Seal */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/65 border border-[#e5c875]/35 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#e5c875]/20 border border-[#e5c875]/40 flex items-center justify-center text-[#e5c875]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white tracking-wide">
                      খাঁটি উপাদান ও নিখুঁত কারুকাজ
                    </p>
                    <p className="text-[11px] text-[#e5c875]/80">
                      শতভাগ আর্টিসানাল মান ও প্রিমিয়াম ফিনিশ
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
                    ১. মদিনা সিল্কের আভিজাত্য
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    আমাদের সিল্ক ওড়নাগুলো ১০০% অপেক ও নন-স্লিপ প্রযুক্তিতে বোনা। মাখনের মতো নরম অনুভূতি, বাতাস সঞ্চালনশীল গঠন এবং সারাদিন ব্যবহারে মাথা থেকে পিছলে না পড়ার রাজকীয় নিশ্চয়তা।
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
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ২. বিশুদ্ধ আতরের রাজকীয় নির্যাস
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    কম্বোডিয়ার দুর্লভ প্রাকৃতিক উদ এবং তায়েফের সুগন্ধি গোলাপের নিখুঁত তেল। শতভাগ অ্যালকোহল মুক্ত, যা নামাজ ও প্রাত্যহিক ব্যবহারে দেয় ১৬ ঘণ্টারও বেশি সময় অটুট সুবাস।
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
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ৩. পবিত্র কুরআন ও লাক্সারি গিফট সেট
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    সহজে বিশুদ্ধ উচ্চারণে তিলাওয়াতের জন্য কালার-কোডেড তাজবীদ সংস্করণ এবং প্রিয়জনকে ইসলামিক আবহে সম্মান জানাতে সুদৃশ্য রাজকীয় প্যাকেজিং।
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
