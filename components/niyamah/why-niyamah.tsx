"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Gem, Heart, Flower2, Gift, ArrowRight, ShieldCheck, Sparkles, Feather } from "lucide-react";

const CARDS_DATA = [
  {
    number: "01",
    enTitle: "Thoughtfully Designed Hijab",
    bnSubtitle: "আরাম, কভারেজ এবং সৌন্দর্যের পারফেক্ট সমন্বয়",
    image: "/niyamah/slider/slider-2-f.png",
    accent: "#e5c875",
    icon: Feather,
    features: [
      "১০০% অরিজিনাল বেক্সি ভয়েল কটন",
      "থুতনী ও মাথার জন্য আলাদা কাপড়",
      "দুই সাইড থেকে কানের চুল বের হবে না",
      "নিচে নিখুঁত ফ্রিল করা কুচি ডিজাইন",
      "নামাজের জন্য পারফেক্ট কভারেজ (৪৩″ / ৫২″)",
    ],
    tag: "Original Bexi Cotton",
  },
  {
    number: "02",
    enTitle: "Elegant Non-Alcoholic Perfume",
    bnSubtitle: "সুবাসে থাকুক পবিত্রতা ও ব্যক্তিত্বের ছোঁয়া",
    image: "/niyamah/slider/slider-1-f.png",
    accent: "#d97d95",
    icon: Sparkles,
    features: [
      "১০০% অ্যালকোহল মুক্ত হালাল ফর্মুলা",
      "দীর্ঘস্থায়ী ও মনোমুগ্ধকর অর্কিড সুবাস",
      "দৈনন্দিন ইবাদত ও ব্যবহারের জন্য পারফেক্ট",
      "নরম, স্নিগ্ধ ও মার্জিত রাজকীয় ঘ্রাণ",
      "পোশাকে ১৬+ ঘণ্টারও বেশি সময় অক্ষুণ্ণ থাকে",
    ],
    tag: "100% Halal Orchid Extrait",
  },
  {
    number: "03",
    enTitle: "Meaningful Gift Package",
    bnSubtitle: "প্রিয়জনের জন্য একটি বিশেষ হাদিয়া",
    image: "/niyamah/slider/slider-3-f.png",
    accent: "#e5c875",
    icon: Gift,
    features: [
      "১টি প্রিমিয়াম সালাত হিজাব (Pure Bexi)",
      "১টি নন অ্যালকোহলিক সুবাসিত পারফিউম",
      "১টি সুপার কিউট টিউলিপ লাক্সারি ব্যাগ",
      "ভালোবাসা ও কৃতজ্ঞতার পরিপূর্ণ প্রকাশ",
      "মা, বোন বা স্ত্রীর জন্য শ্রেষ্ঠ উপহার",
    ],
    tag: "Ready-to-Gift Package",
  },
];

const PILLARS_DATA = [
  {
    icon: Gem,
    titleEn: "Premium Quality",
    titleBn: "খাঁটি উপাদান ও বিশুদ্ধতা",
    descBn: "বেক্সি ভয়েল কটন ও প্রাকৃতিক নির্যাস",
  },
  {
    icon: Heart,
    titleEn: "Designed for Real Needs",
    titleBn: "বাস্তব প্রয়োজনের সুরক্ষা",
    descBn: "চুল না বের হওয়ার বিশেষ শিল্ড",
  },
  {
    icon: Flower2,
    titleEn: "Modesty with Elegance",
    titleBn: "শালীনতার রাজকীয় রূপ",
    descBn: "অন্তরের প্রশান্তি ও আত্মমর্যাদা",
  },
  {
    icon: Gift,
    titleEn: "A More Meaningful You",
    titleBn: "পবিত্রতার চিরন্তন উপহার",
    descBn: "ভালোবাসা প্রকাশের শ্রেষ্ঠ মাধ্যম",
  },
];

export function WhyNiyamahSection() {
  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="why-niyamah"
      className="why-fixed-bg relative w-full overflow-hidden text-[#f8f1e3] py-24 sm:py-32 lg:py-36 border-t border-[#e5c875]/25"
      aria-label="কেন নিয়ামাহ্?"
    >
      {/* Dark Shading & Atmospheric Blur Over the Fixed Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#14060c]/90 via-[#1c0812]/85 to-[#14060c]/92 backdrop-blur-[1.5px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,125,149,0.12)_0%,transparent_70%)]" />

      {/* Main Content Stage */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32">
        
        {/* ======================================================== */}
        {/* 1. TOP PROMISE HEADER & MANIFESTO                        */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-[#e5c875]" />
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.28em] text-[#e5c875]">
              The Niyamah Promise • আত্মমর্যাদা ও প্রশান্তির অঙ্গীকার
            </p>
          </div>

          {/* Grand Bengali Serif Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-[#f8f1e3] tracking-tight">
            শালীনতা শুধু একটি পোশাক নয়, <br />
            <span className="italic text-[#e5c875]">এটি একটি পরম অনুভূতি।</span>
          </h2>

          {/* Subtext Paragraph */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-[#f8f1e3]/85 leading-relaxed max-w-3xl">
            নিয়ামাহ্ আত্তায়ার্স তৈরি করে এমন পণ্য, যেখানে ইবাদতের প্রশান্তি, আরাম এবং সৌন্দর্য একসাথে মিলেমিশে যায়। 
            আমরা বিশ্বাস করি, প্রতিটি নারী প্রাপ্য এমন কিছু—যা তাকে আরও আত্মবিশ্বাসী, আরও শান্তি ও আরও কাছাকাছি নিয়ে যায় তার সৃষ্টিকর্তার।
          </p>

          {/* Sub-tags & Right Quote Row */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-[#d97d95]">
              <span>MORE THAN FASHION</span>
              <span className="text-white/30">•</span>
              <span>A GRACEFUL WAY OF LIFE</span>
            </div>
            <p className="text-xs sm:text-sm font-serif italic text-[#e5c875]/90 tracking-wide">
              “Closer to Allah, A more beautiful you ♡”
            </p>
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* 2. SECTION TITLE: WHY CHOOSE NIYAMAH?                    */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-16 sm:mt-20 flex items-center justify-between pb-6 border-b border-white/10"
        >
          <div>
            <span className="text-[11px] font-mono text-[#e5c875] tracking-[0.25em] uppercase block">
              Core Value Proposition
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-[#f8f1e3] mt-1">
              কেন নিয়ামাহ্? <span className="italic font-normal text-[#d97d95]">Why Choose Niyamah?</span>
            </h3>
          </div>
          <p className="hidden md:block text-xs font-mono text-white/50 tracking-wider">
            ৩টি সিগনেচার পণ্যের নিখুঁত সমাধান
          </p>
        </motion.div>

        {/* ======================================================== */}
        {/* 3. THE 3 VALUE PROPOSITION DISPLAY CARDS                 */}
        {/* ======================================================== */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CARDS_DATA.map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <motion.div
                key={card.number}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "600px" }}
                transition={{ duration: 0.7, delay: idx * 0.14 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-black/60 p-6 sm:p-7 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition-all duration-500 hover:-translate-y-2 hover:border-[#d97d95]/70 hover:bg-[#320d1c]/55 hover:shadow-[0_28px_65px_rgba(217,125,149,0.25)]"
              >
                <div>
                  {/* Top Number & Tag */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif text-2xl font-bold text-[#e5c875] tracking-wider">
                        {card.number}
                      </span>
                      <div className="h-7 w-7 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-[#e5c875]">
                        <CardIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <span className="rounded-full bg-black/60 border border-white/15 px-3 py-1 text-[10px] font-mono text-[#d97d95] tracking-wider">
                      {card.tag}
                    </span>
                  </div>

                  {/* Arched Visual Cutout Window */}
                  <div className="relative aspect-[4/3] w-full mt-5 overflow-hidden rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center p-3">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d97d95]/5 to-black/70 pointer-events-none" />
                    <div className="relative h-full w-full">
                      <Image
                        src={card.image}
                        alt={card.enTitle}
                        fill
                        sizes="(max-width: 768px) 90vw, 400px"
                        className="object-contain p-2 transition-transform duration-700 group-hover:scale-108 drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
                      />
                    </div>
                  </div>

                  {/* Card Title & Subtitle */}
                  <div className="mt-6">
                    <h4 className="font-serif text-xl sm:text-2xl font-medium text-[#f8f1e3]">
                      {card.enTitle}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-[#e5c875] leading-relaxed">
                      {card.bnSubtitle}
                    </p>
                  </div>

                  {/* Checklist Features */}
                  <ul className="mt-5 space-y-2.5 pt-4 border-t border-white/10">
                    {card.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#f8f1e3]/85 leading-relaxed">
                        <span className="h-4 w-4 rounded-full bg-[#e5c875]/15 border border-[#e5c875]/40 flex items-center justify-center shrink-0 mt-0.5 text-[#e5c875]">
                          <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Card CTA */}
                <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#d97d95] tracking-wide">
                    আভিজাত্য ও আস্থার নিশ্চয়তা
                  </span>
                  <a
                    href="#order-section"
                    onClick={handleScrollToOrder}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e5c875] hover:text-white transition-colors cursor-pointer group-hover:translate-x-1 duration-300"
                  >
                    <span>অর্ডার করুন</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 4. BOTTOM 4 PILLARS & SIGNATURE QUOTE                    */}
        {/* ======================================================== */}
        <div className="mt-16 sm:mt-20 pt-10 border-t border-white/15 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: 4 Core Brand Icons */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {PILLARS_DATA.map((pil, idx) => {
              const Icon = pil.icon;
              return (
                <motion.div
                  key={pil.titleEn}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "300px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.07] border border-white/20 flex items-center justify-center text-[#e5c875] shadow-lg mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h5 className="font-serif text-sm font-semibold text-[#f8f1e3]">
                    {pil.titleEn}
                  </h5>
                  <p className="text-[11px] text-[#e5c875] font-medium mt-0.5">
                    {pil.titleBn}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1 leading-normal">
                    {pil.descBn}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Signature Brand Philosophy Quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "300px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-4 p-6 rounded-2xl border border-[#e5c875]/35 bg-gradient-to-br from-[#320d1c]/85 to-black/75 backdrop-blur-md shadow-xl"
          >
            <p className="font-serif italic text-base sm:text-lg text-[#f8f1e3] leading-snug">
              “Because every detail matters to her sacred journey.”
            </p>
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#e5c875]">
                NIYAMAH ATTAYARS
              </span>
              <span className="text-[10px] font-mono text-[#d97d95]">
                হাতে বোনা আভিজাত্য
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
