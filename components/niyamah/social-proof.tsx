"use client";

import { motion } from "framer-motion";
import { Star, ShieldCheck, Quote } from "lucide-react";

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
    purchased: "Medina Silk Hijab • Emerald",
    comment:
      "মদিনা সিল্ক ওড়নাটি হাতে পেয়ে সত্যি মুগ্ধ হয়েছি। ফেব্রিকটি অত্যন্ত আরামদায়ক, মাথা থেকে পিছলে পড়ে না এবং রঙটি ছবিতে যেমন দেখেছি বাস্তবেও ঠিক তেমনই সুন্দর ও উজ্জ্বল।",
    stars: 5,
  },
  {
    id: "r2",
    name: "তানভীর আহমেদ",
    location: "জিইসি মোড়, চট্টগ্রাম",
    purchased: "Cambodian Oud Extrait (6ml)",
    comment:
      "কম্বোডিয়ান উদ আতরটির ঘ্রাণ অসাধারণ আভিজাত্যপূর্ণ। জুমার দিন লাগিয়েছিলাম, পুরো দিন সুবাস অটুট ছিল। ডেলিভারিও পেয়েছি মাত্র ৪৮ ঘণ্টার মধ্যে। নিয়ামাহ্ টিমকে ধন্যবাদ।",
    stars: 5,
  },
  {
    id: "r3",
    name: "ফাতেমা তুজ জোহরা",
    location: "উপশহর, সিলেট",
    purchased: "Royal Islamic Gift Box",
    comment:
      "আমার মায়ের জন্মদিনে রয়েল গিফট বক্সটি উপহার দিয়েছিলাম। কুরআন শরিফ ও জায়নামাজের কোয়ালিটি দেখে মা খুব খুশি হয়েছেন। ক্যাশ অন ডেলিভারিতে চেক করে নেওয়ার সুযোগ ছিল।",
    stars: 5,
  },
  {
    id: "r4",
    name: "মাহমুদুর রহমান",
    location: "উত্তরা, ঢাকা",
    purchased: "Color-Coded Tajweed Quran",
    comment:
      "তাজবীদ কুরআনটির ছাপাই এবং কাগজের মান চোখে পড়ার মতো চমৎকার। তিলাওয়াত করতে খুব আরাম লাগে। প্যাকেজিং ছিল প্রিমিয়াম এবং কোনো ক্ষতি ছাড়া নিরাপদে পৌঁছেছে।",
    stars: 5,
  },
  {
    id: "r5",
    name: "নুসরাত জাহান",
    location: "খুলনা সদর, খুলনা",
    purchased: "Bamboo Modal Hijab",
    comment:
      "ব্যাম্বু মোডাল ফেব্রিকটি গরমে পরার জন্য সেরা। এত নরম ও হালকা যে পরে আছি বোঝাই যায় না। ক্যাশ অন ডেলিভারিতে সুন্দরভাবে ডেলিভারি পেয়েছি।",
    stars: 5,
  },
  {
    id: "r6",
    name: "আরিফুল হক",
    location: "বগুড়া সদর",
    purchased: "Velvet Prayer Mat Set",
    comment:
      "মেমোরি ফোম জায়নামাজটি সেজদায় হাঁটুর জন্য খুবই আরামদায়ক। বাবার জন্য নিয়েছিলাম, বাবা অনেক দোয়া করেছেন। মাশাল্লাহ অসাধারণ পণ্য।",
    stars: 5,
  },
];

export function SocialProofSection() {
  return (
    <section
      id="reviews"
      className="relative w-full bg-[#f6f0e4] text-[#123d2a] py-24 sm:py-32 overflow-hidden border-t border-[#123d2a]/10"
    >
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#123d2a]/15">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#c9a24d]" />
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.24em] text-[#c9a24d]">
                গ্রাহকদের ভালোবাসা • Voices of Grace
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-[#123d2a]">
              বাস্তব অভিজ্ঞতা, নিখুঁত আস্থা, <br />
              <span className="italic text-[#c9a24d]">Verified Patron Stories</span>
            </h2>
          </div>

          {/* Aggregate Rating Badge */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#c9a24d]/30 bg-white/70 backdrop-blur-md">
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#c9a24d]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-xs font-mono font-bold text-[#123d2a]">
                ৪.৯ / ৫.০ গড় রেটিং
              </p>
            </div>
            <div className="h-10 w-px bg-[#123d2a]/15" />
            <div>
              <span className="font-serif text-2xl font-bold text-[#123d2a]">২,৭৪৫+</span>
              <p className="text-[10px] uppercase font-mono tracking-wider text-[#123d2a]/70">
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
              className="flex flex-col justify-between rounded-2xl border border-[#123d2a]/12 bg-white/75 p-6 shadow-[0_10px_25px_rgba(0,0,0,0.03)] backdrop-blur-sm transition-all duration-300 hover:border-[#c9a24d] hover:shadow-[0_18px_40px_rgba(201,162,77,0.12)]"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#123d2a]/8">
                  <div className="flex items-center gap-1 text-[#c9a24d]">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>ভেরিফায়েড বায়ার</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-[#123d2a]/80 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#123d2a]/8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#123d2a]">{rev.name}</p>
                  <p className="text-[10px] font-mono text-[#123d2a]/60">{rev.location}</p>
                </div>
                <span className="text-[10px] font-mono text-[#c9a24d] bg-[#c9a24d]/10 px-2 py-0.5 rounded">
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
