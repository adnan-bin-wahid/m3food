"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

interface CollectionCard {
  id: string;
  tagBn: string;
  titleBn: string;
  subtitleBn: string;
  desc: string;
  image: string;
  accent: string;
}

const COLLECTIONS: CollectionCard[] = [
  {
    id: "silk",
    tagBn: "সিল্ক ও ক্র্যাপ",
    titleBn: "মদিনা সিল্ক ওড়না",
    subtitleBn: "শতভাগ অপেক ও মার্জিত ড্র্যাপ",
    desc: "মাখনের মতো মসৃণ তন্তু, বাতাস সঞ্চালনশীল গঠন ও নন-স্লিপ গ্রিপের সমন্বয়ে তৈরি রাজকীয় সিল্ক ওড়না।",
    image: "/niyamah/editorial/hijab-drape.jpg",
    accent: "#e5c875",
  },
  {
    id: "attar",
    tagBn: "খাঁটি তেল নির্যাস",
    titleBn: "খাঁটি আতর ভল্ট",
    subtitleBn: "১৬+ ঘণ্টা দীর্ঘস্থায়ী সুবাস",
    desc: "কম্বোডিয়ান খাঁটি উদ, তাইফ গোলাপ ও রাজকীয় অ্যাম্বারের সম্পূর্ণ অ্যালকোহল মুক্ত প্রাকৃতিক সুবাস।",
    image: "/niyamah/editorial/perfume-flacon.jpg",
    accent: "#d97d95",
  },
  {
    id: "quran",
    tagBn: "তাজবীদ সংস্করণ",
    titleBn: "পবিত্র কুরআন শরিফ",
    subtitleBn: "কালার-কোডেড ও সোনালী গিল্ডিং",
    desc: "বিশুদ্ধ তিলাওয়াত সহজ করতে কালার-কোডেড তাজবীদ সংস্করণ ও সহজে পাঠযোগ্য রাজকীয় বাঁধাই।",
    image: "/niyamah/hero/hero-quran.png",
    accent: "#e5c875",
  },
  {
    id: "gift",
    tagBn: "লাক্সারি গিফট সেট",
    titleBn: "রয়েল গিফট বক্স",
    subtitleBn: "পূর্ণাঙ্গ ইসলামিক উপহার সম্ভার",
    desc: "কুরআন, ক্রিস্টাল তাসবিহ, সুরভিত আতর ও জায়নামাজের সমন্বয়ে তৈরি প্রিয়জনকে উপহার দেওয়ার সেরা সেট।",
    image: "/niyamah/hero/hero-gift-box.png",
    accent: "#d97d95",
  },
];

export function FeaturedCollectionsSection() {
  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="collections"
      className="relative w-full bg-gradient-to-b from-[#1a070f] via-[#240a15] to-[#1e0811] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-[#d97d95]/10 blur-[140px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                সিগনেচার কালেকশন • মার্জিত পছন্দের অনন্য সংকলন
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              আভিজাত্যের মূল ৪টি স্তম্ভ, <br />
              <span className="italic text-[#e5c875]">পরম যত্নে সংকলিত</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#f8f1e3]/75">
            প্রতিটি কালেকশন ডিজাইন করা হয়েছে মার্জিত পর্দা, আধ্যাত্মিক প্রশান্তি এবং আন্তরিক উপহারের অনুভূতিকে স্মরণীয় করে তুলতে।
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {COLLECTIONS.map((col, idx) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 shadow-[0_16px_35px_rgba(0,0,0,0.35)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#d97d95]/70 hover:bg-[#320d1c]/50 hover:shadow-[0_24px_55px_rgba(217,125,149,0.22)]"
            >
              <div>
                {/* Image Stage */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/40 border border-white/10">
                  <ImageWithFallback
                    src={col.image}
                    alt={col.titleBn}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 360px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 p-2"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-md border border-[#e5c875]/40 px-3 py-1 text-[10px] font-mono font-medium tracking-wider text-[#e5c875] shadow-sm">
                    {col.tagBn}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-5">
                  <p className="text-[11px] font-mono text-[#d97d95]">
                    {col.subtitleBn}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-[#f8f1e3] mt-1">
                    {col.titleBn}
                  </h3>
                  <p className="mt-2 text-xs text-[#f8f1e3]/70 line-clamp-2 leading-relaxed">
                    {col.desc}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#e5c875] group-hover:text-white transition-colors">
                  কালেকশন দেখুন • অর্ডার করুন
                </span>
                <div className="h-8 w-8 rounded-full border border-[#e5c875]/40 flex items-center justify-center text-[#e5c875] transition-all group-hover:border-[#d97d95] group-hover:bg-[#d97d95] group-hover:text-[#1a070f]">
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>

              <a
                href="#order-section"
                onClick={handleScrollToOrder}
                className="absolute inset-0 z-20"
                aria-label={`${col.titleBn} অর্ডার করুন`}
              >
                <span className="sr-only">{col.titleBn} অর্ডার করুন</span>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
