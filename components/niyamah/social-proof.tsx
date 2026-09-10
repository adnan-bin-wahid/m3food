"use client";

import { motion } from "framer-motion";
import { Star, ShieldCheck } from "lucide-react";

interface PatronReview {
  id: string;
  name: string;
  location: string;
  purchased: string;
  comment: string;
  stars: number;
}

const REVIEWS: PatronReview[] = [
  {
    id: "r1",
    name: "সাদিয়া ইসলাম",
    location: "ধানমন্ডি, ঢাকা",
    purchased: "মদিনা সিল্ক ওড়না — রয়েল বেরি",
    comment:
      "মদিনা সিল্ক ওড়নাটি হাতে পেয়ে সত্যি মুগ্ধ হয়েছি। ফেব্রিকটি অত্যন্ত আরামদায়ক, মাথা থেকে পিছলে পড়ে না এবং রঙটি ছবিতে যেমন দেখেছি বাস্তবেও ঠিক তেমনই সুন্দর ও উজ্জ্বল।",
    stars: 5,
  },
  {
    id: "r2",
    name: "তানভীর আহমেদ",
    location: "জিইসি মোড়, চট্টগ্রাম",
    purchased: "অর্কিড পারফিউম (Orchid Perfume)",
    comment:
      "অর্কিড পারফিউমটির ঘ্রাণ অসাধারণ আভিজাত্যপূর্ণ। জুমার দিন ব্যবহার করেছিলাম, পুরো দিন সুবাস অটুট ছিল। ডেলিভারিও পেয়েছি মাত্র ৪৮ ঘণ্টার মধ্যে। নিয়ামাহ্ টিমকে ধন্যবাদ।",
    stars: 5,
  },
  {
    id: "r3",
    name: "ফাতেমা তুজ জোহরা",
    location: "উপশহর, সিলেট",
    purchased: "টিউলিপ গিফট প্যাকেজ (Tulip Gift Package)",
    comment:
      "আমার মায়ের জন্মদিনে টিউলিপ গিফট প্যাকেজটি উপহার দিয়েছিলাম। ব্যাগের ফিনিশ ও ভেতরের প্রেয়ার সেটের কোয়ালিটি দেখে মা খুব খুশি হয়েছেন। ক্যাশ অন ডেলিভারিতে চেক করে নেওয়ার সুযোগ ছিল।",
    stars: 5,
  },
  {
    id: "r4",
    name: "মাহমুদুর রহমান",
    location: "উত্তরা, ঢাকা",
    purchased: "কালার-কোডেড তাজবীদ কুরআন",
    comment:
      "তাজবীদ কুরআনটির ছাপা ও কাগজের মান চোখে পড়ার মতো চমৎকার। তিলাওয়াত করতে খুব আরাম লাগে। প্যাকেজিং ছিল রাজকীয় এবং কোনো ক্ষতি ছাড়া নিরাপদে পৌঁছেছে।",
    stars: 5,
  },
  {
    id: "r5",
    name: "নুসরাত জাহান",
    location: "খুলনা সদর, খুলনা",
    purchased: "ফ্লোরাল প্রেয়ার সেট (Floral Prayer Set)",
    comment:
      "ফ্লোরাল প্রেয়ার সেটটি নামাজে ব্যবহারের জন্য অত্যন্ত আরামদায়ক। কাপড়টি এত নরম ও আরামদায়ক যে মন শান্ত হয়ে যায়। ডেলিভারি ও প্যাকেজিং এক কথায় চমৎকার।",
    stars: 5,
  },
  {
    id: "r6",
    name: "আরিফুল হক",
    location: "বগুড়া সদর",
    purchased: "রয়েল ইসলামিক গিফট বক্স",
    comment:
      "বাবার জন্য গিফট বক্সটি নিয়েছিলাম, বাবা অনেক দোয়া করেছেন। মেমোরি ফোম জায়নামাজ ও সুরভিত আতরের কোয়ালিটি মাশাল্লাহ অসাধারণ। খাঁটি পণ্যের বিশ্বস্ত প্রতিষ্ঠান।",
    stars: 5,
  },
];

export function SocialProofSection() {
  return (
    <section
      id="reviews"
      className="relative w-full bg-gradient-to-b from-[#18060e] via-[#240a15] to-[#1e0811] text-[#f8f1e3] py-24 sm:py-32 overflow-hidden border-t border-[#d97d95]/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#e5c875]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#e5c875]">
                গ্রাহকদের ভালোবাসা • বাস্তব অভিজ্ঞতা ও আস্থা
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#f8f1e3]">
              বাস্তব অভিজ্ঞতা, নিখুঁত আস্থা, <br />
              <span className="italic text-[#e5c875]">সন্তুষ্ট গ্রাহকদের অভিমত</span>
            </h2>
          </div>

          {/* Aggregate Rating Badge */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#e5c875]/30 bg-black/50 backdrop-blur-md shadow-lg">
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#e5c875]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-xs font-mono font-bold text-[#f8f1e3]">
                ৪.৯ / ৫.০ গড় রেটিং
              </p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <span className="font-serif text-2xl font-bold text-[#e5c875]">২,৭৪৫+</span>
              <p className="text-[10px] uppercase font-mono tracking-wider text-[#f8f1e3]/70">
                ভেরিফায়েড রিভিউ
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {REVIEWS.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_16px_35px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:border-[#d97d95]/60 hover:bg-[#320d1c]/40 hover:shadow-[0_22px_45px_rgba(217,125,149,0.18)]"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-1 text-[#e5c875]">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#d97d95]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>ভেরিফায়েড ক্রেতা</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-[#f8f1e3]/85 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#f8f1e3]">{rev.name}</p>
                  <p className="text-[10px] font-mono text-[#f8f1e3]/60">{rev.location}</p>
                </div>
                <span className="text-[10px] font-mono text-[#e5c875] bg-[#e5c875]/10 border border-[#e5c875]/20 px-2.5 py-1 rounded">
                  {rev.purchased}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
