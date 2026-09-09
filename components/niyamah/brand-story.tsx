"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield, Compass, Feather } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

export function BrandStorySection() {
  return (
    <section
      id="story"
      className="relative w-full bg-[#123d2a] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#c9a24d]/20"
    >
      {/* Ambient background lattice & glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-[#c9a24d]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-[#c9a24d]/10 blur-[120px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                আমাদের দর্শন ও ঐতিহ্য • The Brand Manifesto
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              প্রতিটি সুতোয় মর্যাদা, <br />
              <span className="italic text-[#c9a24d]">প্রতিটি সুবাসে প্রশান্তি</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            নিয়ামাহ্ আতায়ারস (Niyamah Attires) কেবল একটি ফ্যাশন লেবেল নয়; এটি মার্জিত পর্দা, আত্মমর্যাদা এবং আধ্যাত্মিক সুবাসের এক নিরবচ্ছিন্ন শৈল্পিক যাত্রা।
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
            <div className="relative aspect-[4/5] w-full max-w-[500px] overflow-hidden rounded-t-[220px] rounded-b-2xl border border-[#c9a24d]/30 shadow-[0_32px_70px_rgba(0,0,0,0.45)]">
              <ImageWithFallback
                src="/niyamah/editorial/brand-craft.jpg"
                alt="24K gold leaf Quran binding craftsmanship"
                fill
                sizes="(max-width: 1024px) 90vw, 500px"
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-3 rounded-t-[210px] rounded-b-xl border border-white/20" />
              
              {/* Floating Craftsmanship Seal */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/60 border border-[#c9a24d]/35 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#c9a24d]/20 border border-[#c9a24d]/40 flex items-center justify-center text-[#c9a24d]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white uppercase tracking-wider">
                      খাঁটি উপাদান ও নিখুঁত কারুকাজ
                    </p>
                    <p className="text-[11px] text-[#f8f1e3]/70">
                      Artisan Craftsmanship & Pure Botanical Sourcing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 3 Pillar Narratives */}
          <div className="lg:col-span-6 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors hover:border-[#c9a24d]/40"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#c9a24d]/15 border border-[#c9a24d]/30 flex items-center justify-center text-[#c9a24d]">
                  <Feather className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ১. মদিনা সিল্কের আভিজাত্য • The Silk Atelier
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    আমাদের সিল্ক ওড়নাগুলো ১০০% অপেক ও নন-স্লিপ প্রযুক্তিতে তৈরি। দীর্ঘ সময় পরে থাকলেও মাথা থেকে পিছলে পড়ে না এবং নরম বাতাস সঞ্চালন নিশ্চিত করে।
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="p-6 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors hover:border-[#c9a24d]/40"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#c9a24d]/15 border border-[#c9a24d]/30 flex items-center justify-center text-[#c9a24d]">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ২. বিশুদ্ধ আতরের নির্যাস • Artisanal Sillage
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    কম্বোডিয়ার গভীর বনাঞ্চলের খাঁটি উদ ও সৌদি আরবের তাইফ গোলাপের প্রাচীন পরিশ্রুত তেলের সমাহার। শতভাগ অ্যালকোহল মুক্ত, যা নামাজ ও দৈনন্দিন ব্যবহারে দেয় অবারিত প্রশান্তি।
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="p-6 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors hover:border-[#c9a24d]/40"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#c9a24d]/15 border border-[#c9a24d]/30 flex items-center justify-center text-[#c9a24d]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#f8f1e3]">
                    ৩. তাজবীদ কুরআন ও উপহার বক্স • Sacred Keepsakes
                  </h3>
                  <p className="mt-2 text-sm text-[#f8f1e3]/75 leading-relaxed">
                    সঠিক উচ্চারণে কুরআন তিলাওয়াত সহজ করতে কালার-কোডেড তাজবীদ সংস্করণ এবং প্রিয়জনের জন্য সুদৃশ্য ভেলভেট ও উডেন গিফট বক্স।
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
