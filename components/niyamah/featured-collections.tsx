"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "./reference-link";
import { ImageWithFallback } from "./image-with-fallback";

interface CollectionCard {
  id: string;
  tag: string;
  titleBn: string;
  titleEn: string;
  desc: string;
  image: string;
  link: string;
  accent: string;
}

const COLLECTIONS: CollectionCard[] = [
  {
    id: "silk",
    tag: "Haute Hijab & Crepe",
    titleBn: "মদিনা সিল্ক ওড়না",
    titleEn: "The Silk Atelier",
    desc: "১০০% অপেক, বাতাস সঞ্চালনশীল ও মার্জিত ড্র্যাপের সমন্বয়ে তৈরি রাজকীয় সিল্ক ওড়না।",
    image: "/niyamah/editorial/hijab-drape.jpg",
    link: "/category/hijab",
    accent: "#c9a24d",
  },
  {
    id: "attar",
    tag: "Pure Oil Extrait",
    titleBn: "খাঁটি আতর ভল্ট",
    titleEn: "The Attar Vault",
    desc: "কম্বোডিয়ান খাঁটি উদ, তাইফ গোলাপ ও রাজকীয় অ্যাম্বারের ১৬+ ঘণ্টা দীর্ঘস্থায়ী সুবাস।",
    image: "/niyamah/editorial/perfume-flacon.jpg",
    link: "/category/attar",
    accent: "#d9b86c",
  },
  {
    id: "quran",
    tag: "Tajweed Edition",
    titleBn: "পবিত্র কুরআন শরিফ",
    titleEn: "Sacred Quran Library",
    desc: "কালার-কোডেড তাজবীদ সংস্করণ ও সহজে পাঠযোগ্য রাজকীয় বাঁধাই ও সোনার গিল্ডিং।",
    image: "/niyamah/hero/hero-quran.png",
    link: "/category/quran",
    accent: "#c9a24d",
  },
  {
    id: "gift",
    tag: "Bespoke Keepsakes",
    titleBn: "রয়েল গিফট বক্স",
    titleEn: "Royal Keepsake Boxes",
    desc: "কুরআন, ক্রিস্টাল তাসবিহ, সুরভিত আতর ও জায়নামাজের সমন্বয়ে তৈরি প্রিমিয়াম সেট।",
    image: "/niyamah/hero/hero-gift-box.png",
    link: "/category/gift-box",
    accent: "#d9b86c",
  },
];

export function FeaturedCollectionsSection() {
  return (
    <section
      id="collections"
      className="relative w-full bg-[#f8f1e3] text-[#123d2a] py-24 sm:py-32 overflow-hidden border-t border-[#123d2a]/10"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-[#123d2a]/15">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                সিজনাল কালেকশন • The Seasonal Monograph
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#123d2a]">
              আভিজাত্যের মূল ৪টি স্তম্ভ, <br />
              <span className="italic text-[#c9a24d]">Curated For Meaning</span>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base font-normal leading-relaxed text-[#123d2a]/70">
            প্রতিটি ক্যাটাগরি ডিজাইন করা হয়েছে মার্জিত পর্দা, আধ্যাত্মিক সংযোগ এবং আন্তরিক উপহারের অনুভূতিকে স্মরণীয় করে তুলতে।
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
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#123d2a]/15 bg-white/70 backdrop-blur-sm p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#c9a24d] hover:shadow-[0_24px_50px_rgba(201,162,77,0.18)]"
            >
              <div>
                {/* Image Stage */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#123d2a]/5">
                  <ImageWithFallback
                    src={col.image}
                    alt={col.titleBn}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 360px"
                    className="object-cover transition-transform duration-700 group-hover:scale-108 p-2"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#123d2a] shadow-sm">
                    {col.tag}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-5">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#c9a24d]">
                    {col.titleEn}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-[#123d2a] mt-1">
                    {col.titleBn}
                  </h3>
                  <p className="mt-2 text-xs text-[#123d2a]/70 line-clamp-2 leading-relaxed">
                    {col.desc}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-4 border-t border-[#123d2a]/10 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#123d2a] group-hover:text-[#c9a24d] transition-colors">
                  কালেকশন দেখুন • Explore
                </span>
                <div className="h-8 w-8 rounded-full border border-[#123d2a]/20 flex items-center justify-center text-[#123d2a] transition-all group-hover:border-[#c9a24d] group-hover:bg-[#123d2a] group-hover:text-[#f8f1e3]">
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>

              <Link href={col.link} className="absolute inset-0 z-20" aria-label={`View ${col.titleBn}`}>
                <span className="sr-only">View {col.titleBn}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
