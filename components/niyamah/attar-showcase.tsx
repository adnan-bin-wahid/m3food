"use client";

import { motion } from "framer-motion";
import { Sparkles, Droplets, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "./reference-link";
import { ImageWithFallback } from "./image-with-fallback";

export function AttarShowcaseSection() {
  return (
    <section
      id="fragrance-notes"
      className="relative w-full bg-[#0a120e] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#c9a24d]/20"
    >
      {/* Warm amber & oud ambient aura */}
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-[#8a6422]/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-80 w-80 rounded-full bg-[#c9a24d]/10 blur-[120px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                আতর ও সুবাস ভল্ট • The Olfactory Sillage
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              স্মল ব্যাচ এক্সট্রেইট, <br />
              <span className="italic text-[#c9a24d]">Pure Botanical Patience</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            প্রাচীন পদ্ধতিতে নিষ্কাশিত ১০০% খাঁটি প্রাকৃতিক তেল। কৃত্রিম স্প্রে বা অ্যালকোহলের কোনো স্পর্শ ছাড়াই দীর্ঘস্থায়ী এক রাজকীয় অনুভূতির জন্ম দেয়।
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: The Olfactory Pyramid */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <Droplets className="h-5 w-5 text-[#c9a24d]" />
                <h3 className="font-serif text-xl font-medium text-[#f8f1e3]">
                  সুগন্ধি পিরামিড • Fragrance Pyramid
                </h3>
              </div>

              {/* Note 1: Top Notes */}
              <div className="mb-5 pb-5 border-b border-white/8">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-[#c9a24d]">
                    ১. শীর্ষ নোটস • Top Notes
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">প্রথম ০–১৫ মিনিট</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  বর্গামোট ও কাশ্মীরি জাফরান (Bergamot & Kashmiri Saffron)
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  প্রথম স্পন্দন যা চারপাশকে সতেজ ও প্রাণবন্ত করে তোলে।
                </p>
              </div>

              {/* Note 2: Heart Notes */}
              <div className="mb-5 pb-5 border-b border-white/8">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-[#c9a24d]">
                    ২. হৃদয়ের সুবাস • Heart Notes
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">২–৬ ঘণ্টা স্থায়ী</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  তাইফ গোলাপ ও ডামাস্কাস জুঁই (Taif Rose & Jasmine)
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  কোমল ও মিষ্টি ফুলের এক মোহনীয় আভিজাত্য।
                </p>
              </div>

              {/* Note 3: Base Notes */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-[#c9a24d]">
                    ৩. মূল স্থায়িত্ব • Base Notes
                  </span>
                  <span className="text-[11px] text-[#f8f1e3]/60">১৬+ ঘণ্টা স্থায়ী</span>
                </div>
                <p className="mt-1.5 text-base font-medium text-[#f8f1e3]">
                  কম্বোডিয়ান খাঁটি উদ ও হোয়াইট অ্যাম্বার (Cambodian Agarwood Oud)
                </p>
                <p className="mt-1 text-xs text-[#f8f1e3]/70">
                  গভীর, উষ্ণ ও রহস্যময় কাঠুরে সুবাস যা কাপড়ে ও ত্বকে সারাদিন রাজত্ব করে।
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#c9a24d]">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">স্থায়িত্ব</span>
                </div>
                <p className="mt-1 text-base font-semibold text-[#f8f1e3]">১৬+ ঘণ্টা নিশ্চিত</p>
                <p className="text-[11px] text-[#f8f1e3]/60">Long-Lasting Oil Sillage</p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-[#c9a24d]">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">বিশুদ্ধতা</span>
                </div>
                <p className="mt-1 text-base font-semibold text-[#f8f1e3]">১০০% অ্যালকোহল মুক্ত</p>
                <p className="text-[11px] text-[#f8f1e3]/60">Alcohol-Free Pure Extrait</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Stage with Arched Bottle Silhouette */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-t-[200px] rounded-b-2xl border border-[#c9a24d]/40 shadow-[0_32px_75px_rgba(0,0,0,0.6)]">
              <ImageWithFallback
                src="/niyamah/editorial/perfume-flacon.jpg"
                alt="Artisanal amber glass perfume bottle on travertine stone"
                fill
                sizes="(max-width: 1024px) 90vw, 460px"
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-2.5 rounded-t-[190px] rounded-b-xl border border-white/20" />

              {/* Action Floating CTA */}
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-black/75 border border-[#c9a24d]/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    খাঁটি আতর সংগ্রহ • The Attar Vault
                  </p>
                  <p className="text-[11px] text-[#c9a24d]">
                    স্মল ব্যাচ পরিশ্রুত তেল
                  </p>
                </div>
                <Link
                  href="/category/attar"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-[#c9a24d] px-4 text-xs font-semibold uppercase tracking-wider text-[#123d2a] shadow-md transition-transform hover:-translate-y-0.5"
                >
                  <span>অর্ডার করুন</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
